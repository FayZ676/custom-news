import logging
import re
from collections.abc import Iterator

import requests
import tiktoken
from tiktoken import Encoding
from pydantic import BaseModel
from tenacity import retry, retry_if_exception, stop_after_attempt

from openfeed.config import settings


class _OpenAIEmbeddingItem(BaseModel):
    object: str
    index: int
    embedding: list[float]


class _OpenAIUsage(BaseModel):
    prompt_tokens: int
    total_tokens: int


class _OpenAIEmbeddingResponse(BaseModel):
    object: str
    data: list[_OpenAIEmbeddingItem]
    model: str
    usage: _OpenAIUsage


class EmbeddingsResponse(BaseModel):
    embeddings: list[list[float]]
    model: str


def _prepare(text: str, encoder: Encoding) -> tuple[str, int]:
    """Truncate text to the token limit. Returns (truncated_text, token_count)."""
    tokens = encoder.encode(text)
    truncated = tokens[: settings.embedding_max_tokens_per_input]
    return encoder.decode(truncated), len(truncated)


def _make_batches(texts: list[str]) -> Iterator[list[str]]:
    """Yield token-budget-respecting batches of prepared texts."""
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


class RateLimitError(Exception):
    def __init__(self, message: str, retry_after: float) -> None:
        super().__init__(message)
        self.retry_after = retry_after


def _parse_retry_after(response: requests.Response) -> float:
    if header := response.headers.get("Retry-After"):
        return float(header) + 0.5
    if match := re.search(r"try again in ([0-9.]+)s", response.text):
        return float(match.group(1)) + 0.5
    return 60.0


def _is_rate_limit_error(exc: BaseException) -> bool:
    return isinstance(exc, RateLimitError)


def _wait_from_exception(retry_state) -> float:
    exc = retry_state.outcome.exception()
    assert isinstance(exc, RateLimitError)
    return exc.retry_after


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
def _post_embeddings(texts: list[str]) -> _OpenAIEmbeddingResponse:
    response = requests.post(
        "https://api.openai.com/v1/embeddings",
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "input": texts,
            "model": settings.embedding_model,
            "dimensions": settings.embedding_dimensions,
        },
        timeout=(10, 30),
    )
    if response.status_code == 429:
        raise RateLimitError(
            f"OpenAI rate limit: {response.text}",
            retry_after=_parse_retry_after(response),
        )

    if not response.ok:
        raise RuntimeError(
            f"OpenAI API error ({response.status_code}): {response.text}"
        )

    return _OpenAIEmbeddingResponse(**response.json())


def embed_texts(texts: list[str]) -> EmbeddingsResponse:
    all_embeddings: list[list[float]] = []
    model = ""

    for batch in _make_batches(texts):
        result = _post_embeddings(batch)
        all_embeddings.extend(item.embedding for item in result.data)
        model = model or result.model

    return EmbeddingsResponse(embeddings=all_embeddings, model=model)
