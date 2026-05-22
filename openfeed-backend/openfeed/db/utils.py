import json
import itertools
from typing import Any, Callable
from collections.abc import Iterator

from pydantic import Json

from openfeed.db.client import Client


def decode_embeddings(row: Json) -> None:
    """Deserialize the embeddings fields in-place, if present."""
    for field in ["summary_embeddings"]:
        if (raw := row.get(field)) is not None and isinstance(raw, str):
            row[field] = json.loads(raw)


# TODO: Can we use Generic typing here?
def paginated_query(
    db: Client,
    table: str,
    *,
    select: str = "*",
    filters: dict[str, str | bool] | None = None,
    in_filters: dict[str, list[str]] | None = None,
    gte_filters: dict[str, str] | None = None,
    page_size: int = 1000,
    transform: Callable[[Json], None] | None = None,
) -> Iterator[list[Any]]:
    """Yield pages of rows from a table, one page per iteration."""
    for page in itertools.count():
        query = db.table(table).select(select)
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)
        if in_filters:
            for column, values in in_filters.items():
                query = query.in_(column, values)
        if gte_filters:
            for column, value in gte_filters.items():
                query = query.gte(column, value)
        rows = query.range(page * page_size, (page + 1) * page_size - 1).execute().data
        if transform:
            for row in rows:
                transform(row)
        if rows:
            yield rows
        if len(rows) < page_size:
            break
