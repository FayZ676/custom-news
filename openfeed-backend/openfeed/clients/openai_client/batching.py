from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Any, TypeVar

from pydantic import BaseModel, create_model

from openfeed.clients.openai_client.models import Message

T = TypeVar("T", bound=BaseModel)


def _merge_messages_for_batch(group: list[list[Message]]) -> list[Message]:
    parts = [
        f'<item index="{i}">\n{msgs[-1].content}\n</item>'
        for i, msgs in enumerate(group)
    ]
    return [Message(role="user", content="\n\n".join(parts))]


@dataclass(frozen=True)
class BatchPlan:
    effective_batch: list[list[Message]]
    group_sizes: list[int] | None
    effective_model: type[BaseModel]


def prepare_batch(
    messages_batch: list[list[Message]],
    batch_size: int,
    response_model: type[BaseModel],
) -> BatchPlan:
    """Pure function — derives the effective batch, group sizes, and response model."""
    if batch_size <= 1:
        return BatchPlan(messages_batch, None, response_model)
    groups = [
        messages_batch[i : i + batch_size]
        for i in range(0, len(messages_batch), batch_size)
    ]
    return BatchPlan(
        effective_batch=[_merge_messages_for_batch(g) for g in groups],
        group_sizes=[len(g) for g in groups],
        effective_model=create_model(
            "_BatchedResponse", items=(list[response_model], ...)  # type: ignore[valid-type]
        ),
    )


def execute_wave(
    window: list[list[Message]],
    execute_one: Callable[[list[Message]], Any],
) -> list:
    """Execute a single wave of requests in parallel, returning results as a plain list."""
    with ThreadPoolExecutor(max_workers=len(window)) as executor:
        return list(executor.map(execute_one, window))


def unbatch_results(
    raw: list, group_sizes: list[int], _response_model: type[T]
) -> list[T]:
    """Pure function — re-expands batched results back to per-item results."""

    def expand(indexed: tuple[int, tuple]) -> list[T]:
        i, (result, expected) = indexed
        if len(result.items) != expected:
            raise ValueError(
                f"Batch {i}: model returned {len(result.items)} items, "
                f"expected {expected}"
            )
        return result.items

    return [
        item
        for chunk in map(expand, enumerate(zip(raw, group_sizes)))
        for item in chunk
    ]
