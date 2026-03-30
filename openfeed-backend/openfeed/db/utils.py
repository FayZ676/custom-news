import json
import itertools
from typing import Any, Callable
from collections.abc import Iterator

from pydantic import Json

from openfeed.db.client import Client


def decode_embeddings(row: Json) -> None:
    """Deserialize the embeddings field in-place, if present."""
    if (raw := row.get("embeddings")) is not None:
        row["embeddings"] = json.loads(raw)


# TODO: Can we use Generic typing here?
def paginated_query(
    db: Client,
    table: str,
    *,
    select: str = "*",
    filters: dict[str, str] | None = None,
    page_size: int = 1000,
    transform: Callable[[Json], None] | None = None,
) -> Iterator[list[Any]]:
    """Yield pages of rows from a table, one page per iteration."""
    for page in itertools.count():
        query = db.table(table).select(select)
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)
        rows = query.range(page * page_size, (page + 1) * page_size - 1).execute().data
        if transform:
            for row in rows:
                transform(row)
        if rows:
            yield rows
        if len(rows) < page_size:
            break
