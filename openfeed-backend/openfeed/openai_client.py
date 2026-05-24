import re
import logging
from collections.abc import Iterator
from dataclasses import dataclass
from typing import TypeVar, Literal, cast

import tiktoken
import openai
from openai import OpenAI
from openai.types import Reasoning, ReasoningEffort
from openai.types.responses import EasyInputMessageParam, ResponseInputParam
from openai._types import omit  # type: ignore[attr-defined]
from pydantic import BaseModel
from tenacity import retry, retry_if_exception, stop_after_attempt
from tiktoken import Encoding

from openfeed.config import settings

T = TypeVar("T", bound=BaseModel)


@dataclass(frozen=True)
class Message:
    role: Literal["system", "user", "assistant"]
    content: str


class EmbeddingsResponse(BaseModel):
    embeddings: list[list[float]]
    model: str


class _RateLimitError(Exception):
    def __init__(self, message: str, retry_after: float) -> None:
        super().__init__(message)
        self.retry_after = retry_after


def _parse_retry_after(exc: openai.RateLimitError) -> float:
    try:
        headers = exc.response.headers  # type: ignore[union-attr]
        if header := headers.get("Retry-After") or headers.get("retry-after"):
            return float(header) + 0.5
        if match := re.search(r"try again in ([0-9.]+)s", str(exc)):
            return float(match.group(1)) + 0.5
    except Exception:
        pass
    return 60.0


def _is_rate_limit_error(exc: BaseException) -> bool:
    return isinstance(exc, _RateLimitError)


def _wait_from_exception(retry_state) -> float:
    exc = retry_state.outcome.exception()
    assert isinstance(exc, _RateLimitError)
    return exc.retry_after


def _prepare(text: str, encoder: Encoding) -> tuple[str, int]:
    tokens = encoder.encode(text)
    truncated = tokens[: settings.embedding_max_tokens_per_input]
    return encoder.decode(truncated), len(truncated)


def _make_batches(texts: list[str]) -> Iterator[list[str]]:
    batch: list[str] = []
    batch_tokens = 0
    encoder = tiktoken.encoding_for_model(settings.embedding_model)

    for text in texts:
        text, tokens = _prepare(text, encoder)

        if batch and batch_tokens + tokens > settings.embedding_max_tokens_per_batch:
            yield batch
            batch, batch_tokens = [], 0

        batch.append(text)
        batch_tokens += tokens

    if batch:
        yield batch


class OpenAIClient:
    def __init__(
        self,
        model: Literal["gpt-5.4", "gpt-5.4-nano"] = "gpt-5.4-nano",
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

    @retry(
        retry=retry_if_exception(_is_rate_limit_error),
        wait=_wait_from_exception,
        stop=stop_after_attempt(5),
        reraise=True,
        before_sleep=lambda rs: logging.warning(
            "Rate limit hit — retrying in %.1fs (attempt %d/5)",
            _wait_from_exception(rs),
            rs.attempt_number,
        ),
    )
    def _invoke(self, fn):
        try:
            return fn()
        except openai.RateLimitError as exc:
            raise _RateLimitError(str(exc), _parse_retry_after(exc)) from exc

    def embed(self, texts: list[str]) -> EmbeddingsResponse:
        all_embeddings: list[list[float]] = []
        for batch in _make_batches(texts):

            def call(batch=batch):
                response = self._client.embeddings.create(
                    input=batch,
                    model=settings.embedding_model,
                    dimensions=settings.embedding_dimensions,
                )
                return [item.embedding for item in response.data]

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

        def call():
            response = self._client.responses.parse(
                model=self._model,
                input=cast(ResponseInputParam, input_),
                temperature=self._temperature,
                text_format=response_model,
                instructions=self._instructions.content if self._instructions else None,
                prompt_cache_key=self._prompt_cache_key or omit,
                prompt_cache_retention="24h" if self._prompt_cache_key else omit,
                reasoning=self._reasoning_effort and Reasoning(effort=self._reasoning_effort, summary="concise"),  # type: ignore
            )
            return response.output_parsed  # type: ignore

        return self._invoke(call)
