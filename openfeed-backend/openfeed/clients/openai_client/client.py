import logging
import statistics
from typing import TypeVar, Literal, cast

from openai import OpenAI
from openai.types import Reasoning, ReasoningEffort
from openai.types.responses import EasyInputMessageParam, ResponseInputParam
from openai._types import omit  # type: ignore[attr-defined]
from pydantic import BaseModel

from openfeed.config import settings
from openfeed.clients.openai_client.models import Message
from openfeed.clients.openai_client.rate_limiter import RateLimiter, get_rate_limiter
from openfeed.clients.openai_client.ramp import RampStrategy, Fibonacci
from openfeed.clients.openai_client.tokens import make_batches, estimate_input_tokens
from openfeed.clients.openai_client.batching import (
    prepare_batch,
    execute_wave,
    unbatch_results,
)

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class EmbeddingsResponse(BaseModel):
    embeddings: list[list[float]]
    model: str


class OpenAIClient:
    def __init__(
        self,
        model: Literal[
            "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-5-nano"
        ] = "gpt-5-nano",
        embedding_model: str = "text-embedding-3-large",
        temperature: float = 0.0,
        reasoning_effort: ReasoningEffort | None = None,
        prompt_cache_key: str | None = None,
        instructions: Message | None = None,
    ) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key)
        self._model = model
        self.embedding_model = embedding_model
        self._temperature = temperature
        self._reasoning_effort = reasoning_effort
        self._prompt_cache_key = prompt_cache_key
        self._instructions = instructions
        self._response_rate_limiter: RateLimiter = get_rate_limiter(model)
        self._embedding_rate_limiter: RateLimiter = get_rate_limiter(
            self.embedding_model
        )

    def _invoke(self, fn):
        return fn()

    def embed(self, texts: list[str]) -> EmbeddingsResponse:
        all_embeddings: list[list[float]] = []
        for batch, batch_tokens in make_batches(texts, self.embedding_model):
            self._embedding_rate_limiter.acquire(batch_tokens)

            def call(batch=batch):
                raw = self._client.embeddings.with_raw_response.create(
                    input=batch,
                    model=self.embedding_model,
                    dimensions=settings.embedding_dimensions,
                )
                self._embedding_rate_limiter.update_from_headers(raw.headers)
                return [item.embedding for item in raw.parse().data]

            all_embeddings.extend(self._invoke(call))
        return EmbeddingsResponse(embeddings=all_embeddings, model=self.embedding_model)

    def generate_response(
        self,
        messages: list[Message],
        response_model: type[T],
    ) -> T:
        input_: list[EasyInputMessageParam] = [
            EasyInputMessageParam(role=m.role, content=m.content) for m in messages
        ]
        estimated_tokens = estimate_input_tokens(
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
        batch_size: int = 1,
    ) -> list[T]:
        """Send a batch of requests using a pluggable wave-based ramp strategy.

        When ``batch_size > 1``, messages are merged into a single request using
        ``<item index="N">`` XML tags to amortise system-prompt token costs.
        The model must return exactly one result per item, or ``ValueError`` is raised.
        """
        plan = prepare_batch(messages_batch, batch_size, response_model)
        execute_one = lambda msgs: self.generate_response(msgs, plan.effective_model)

        results: list = []
        pos = 0
        while pos < len(plan.effective_batch):
            window = plan.effective_batch[pos : pos + ramp.current]
            avg_tokens = round(
                statistics.mean(
                    estimate_input_tokens(
                        m, self._instructions, self._model, plan.effective_model
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

            results += execute_wave(window, execute_one)

            logger.debug(
                "Ramp wave completed: wave_size=%d, pos=%d->%d, total=%d",
                len(window),
                pos,
                pos + len(window),
                len(plan.effective_batch),
            )

            ramp.speed_up()
            pos += len(window)

        return (
            unbatch_results(
                results,
                plan.group_sizes,
                response_model,
                plan.effective_batch,
            )
            if plan.group_sizes
            else results
        )  # type: ignore[return-value]  # noqa: return-value
