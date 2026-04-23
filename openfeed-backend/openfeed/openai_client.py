import re
import logging
from collections.abc import Iterator
from typing import TypeVar, Literal

import tiktoken
import openai
from openai import OpenAI
from openai.types import Reasoning, ReasoningEffort
from pydantic import BaseModel
from tenacity import retry, retry_if_exception, stop_after_attempt
from tiktoken import Encoding

from openfeed.config import settings


T = TypeVar("T", bound=BaseModel)


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
    def __init__(self) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key)

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
        model: Literal["gpt-5.4", "gpt-5.4-nano"],
        prompt: str,
        response_model: type[T],
        temperature: float = 0.0,
        reasoning_effort: ReasoningEffort | None = None,
    ) -> T:
        def call():
            response = self._client.responses.parse(
                model=model,
                input=prompt,
                temperature=temperature,
                text_format=response_model,
                reasoning=reasoning_effort and Reasoning(effort=reasoning_effort, summary="concise"),  # type: ignore
            )
            return response.output_parsed  # type: ignore

        return self._invoke(call)


openai_client = OpenAIClient()
