import json
import logging
import statistics
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from typing import TypeVar, Literal, cast

import tiktoken
from openai import OpenAI
from openai.types import Reasoning, ReasoningEffort
from openai.types.responses import EasyInputMessageParam, ResponseInputParam
from openai._types import omit  # type: ignore[attr-defined]
from pydantic import BaseModel
from tiktoken import Encoding

from openfeed.config import settings
from openfeed.clients.openai_client.rate_limiter import RateLimiter, get_rate_limiter
from openfeed.clients.openai_client.ramp import RampStrategy, Fibonacci

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class Message(BaseModel, frozen=True):
    role: Literal["system", "user", "assistant"]
    content: str


class EmbeddingsResponse(BaseModel):
    embeddings: list[list[float]]
    model: str


def _prepare(text: str, encoder: Encoding) -> tuple[str, int]:
    tokens = encoder.encode(text)
    truncated = tokens[: settings.embedding_max_tokens_per_input]
    return encoder.decode(truncated), len(truncated)


def _make_batches(texts: list[str]) -> Iterator[tuple[list[str], int]]:
    """Yield (batch, token_count) pairs respecting per-input and per-batch token limits."""
    batch: list[str] = []
    batch_tokens = 0
    encoder = tiktoken.encoding_for_model(settings.embedding_model)

    for text in texts:
        text, tokens = _prepare(text, encoder)

        if batch and batch_tokens + tokens > settings.embedding_max_tokens_per_batch:
            yield batch, batch_tokens
            batch, batch_tokens = [], 0

        batch.append(text)
        batch_tokens += tokens

    if batch:
        yield batch, batch_tokens


def _get_encoder(model: str) -> Encoding:
    """Return the tiktoken encoder for a model, falling back to o200k_base.

    GPT-4o and later models use o200k_base. Older models (GPT-3.5, GPT-4)
    use cl100k_base. tiktoken may not know very new model names by string, so
    we fall back gracefully rather than crashing.
    """
    try:
        return tiktoken.encoding_for_model(model)
    except KeyError:
        return tiktoken.get_encoding("o200k_base")


def _estimate_input_tokens(
    messages: list[Message],
    instructions: Message | None,
    model: str,
    response_model: type[BaseModel] | None = None,
    token_padding: int = 4,
) -> int:
    """Estimate the number of input tokens for a responses API call.

    ``token_padding`` controls the per-message overhead added on top of the
    raw token count (default: 4, matching the OpenAI cookbook approximation).
    """
    encoder = _get_encoder(model)
    total = 2  # reply primer approximation (chat completions: <im_start>assistant)
    if instructions:
        total += token_padding + len(encoder.encode(instructions.content))
    for message in messages:
        total += token_padding + len(encoder.encode(message.content))
    if response_model is not None:
        schema_text = json.dumps(response_model.model_json_schema())
        total += len(encoder.encode(schema_text))
    return total


class OpenAIClient:
    def __init__(
        self,
        model: Literal[
            "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-5-nano"
        ] = "gpt-5-nano",
        temperature: float = 0.0,
        reasoning_effort: ReasoningEffort | None = None,
        prompt_cache_key: str | None = None,
        instructions: Message | None = None,
    ) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key)
        self._model = model
        self._temperature = temperature
        self._reasoning_effort = reasoning_effort
        self._prompt_cache_key = prompt_cache_key
        self._instructions = instructions
        self._response_rate_limiter: RateLimiter = get_rate_limiter(model)
        self._embedding_rate_limiter: RateLimiter = get_rate_limiter(
            settings.embedding_model
        )

    def _invoke(self, fn):
        return fn()

    def embed(self, texts: list[str]) -> EmbeddingsResponse:
        all_embeddings: list[list[float]] = []
        for batch, batch_tokens in _make_batches(texts):
            self._embedding_rate_limiter.acquire(batch_tokens)

            def call(batch=batch):
                raw = self._client.embeddings.with_raw_response.create(
                    input=batch,
                    model=settings.embedding_model,
                    dimensions=settings.embedding_dimensions,
                )
                self._embedding_rate_limiter.update_from_headers(raw.headers)
                return [item.embedding for item in raw.parse().data]

            all_embeddings.extend(self._invoke(call))
        return EmbeddingsResponse(
            embeddings=all_embeddings, model=settings.embedding_model
        )

    def generate_response(
        self,
        messages: list[Message],
        response_model: type[T],
    ) -> T:
        input_: list[EasyInputMessageParam] = [
            EasyInputMessageParam(role=m.role, content=m.content) for m in messages
        ]
        estimated_tokens = _estimate_input_tokens(
            messages, self._instructions, self._model, response_model
        )
        self._response_rate_limiter.acquire(estimated_tokens)

        def call():
            raw = self._client.responses.with_raw_response.parse(
                model=self._model,
                input=cast(ResponseInputParam, input_),
                temperature=omit if self._model == "gpt-5-nano" else self._temperature,
                text_format=response_model,
                instructions=self._instructions.content if self._instructions else None,
                prompt_cache_key=self._prompt_cache_key or omit,
                prompt_cache_retention="24h" if self._prompt_cache_key else omit,
                reasoning=self._reasoning_effort and Reasoning(effort=self._reasoning_effort, summary="concise"),  # type: ignore
            )
            self._response_rate_limiter.update_from_headers(raw.headers)
            return raw.parse().output_parsed  # type: ignore

        return self._invoke(call)  # type: ignore[return-value]

    def generate_responses(
        self,
        messages_batch: list[list[Message]],
        response_model: type[T],
        ramp: RampStrategy = Fibonacci(),
    ) -> list[T]:
        """Send a batch of requests using a pluggable wave-based ramp strategy.

        The ramp owns the wave size sequence. After each wave it either speeds
        up (if the wave fired uncapped) or slows down (if the desired size
        would exceed rate limit headroom).
        """
        results: list[T] = [None] * len(messages_batch)  # type: ignore[list-item]
        pos = 0
        while pos < len(messages_batch):
            window = messages_batch[pos : pos + ramp.current]
            avg_tokens = round(
                statistics.mean(
                    _estimate_input_tokens(
                        m, self._instructions, self._model, response_model
                    )
                    for m in window
                )
            )
            cap = self._response_rate_limiter.max_wave_size(avg_tokens)

            if cap == 0:
                raise RuntimeError(
                    "Rate limiter has no headroom — cannot make progress."
                )

            if ramp.current > cap:
                ramp.slow_down()
                continue

            with ThreadPoolExecutor(max_workers=len(window)) as executor:
                for i, result in enumerate(
                    executor.map(
                        lambda msgs: self.generate_response(msgs, response_model),
                        window,
                    )
                ):
                    results[pos + i] = result

            logger.debug(
                "Ramp wave completed: wave_size=%d, pos=%d->%d, total=%d",
                len(window),
                pos,
                pos + len(window),
                len(messages_batch),
            )

            ramp.speed_up()
            pos += len(window)

        return results
