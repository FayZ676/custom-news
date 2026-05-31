import json
from collections.abc import Iterator

import tiktoken
from pydantic import BaseModel
from tiktoken import Encoding

from openfeed.config import settings
from openfeed.clients.openai_client.models import Message


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


def _prepare(text: str, encoder: Encoding) -> tuple[str, int]:
    tokens = encoder.encode(text)
    truncated = tokens[: settings.embedding_max_tokens_per_input]
    return encoder.decode(truncated), len(truncated)


def make_batches(
    texts: list[str], embedding_model: str
) -> Iterator[tuple[list[str], int]]:
    """Yield (batch, token_count) pairs respecting per-input and per-batch token limits."""
    batch: list[str] = []
    batch_tokens = 0
    encoder = tiktoken.encoding_for_model(embedding_model)

    for text in texts:
        text, tokens = _prepare(text, encoder)

        if batch and batch_tokens + tokens > settings.embedding_max_tokens_per_batch:
            yield batch, batch_tokens
            batch, batch_tokens = [], 0

        batch.append(text)
        batch_tokens += tokens

    if batch:
        yield batch, batch_tokens


def estimate_input_tokens(
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
