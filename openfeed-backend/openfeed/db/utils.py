import json
import itertools
from typing import Callable

from pydantic import Json

from openfeed.db.client import Client


def _decode_embeddings(row: Json) -> None:
    """Deserialize the embeddings field in-place, if present."""
    if (raw := row.get("embeddings")) is not None:
        row["embeddings"] = json.loads(raw)


def _paginated_query(
    db: Client,
    table: str,
    *,
    select: str = "*",
    filters: dict[str, str] | None = None,
    page_size: int = 1000,
    transform: Callable[[Json], None] | None = None,
) -> list[dict]:
    """Fetch all rows from a table with automatic pagination."""
    results = []
    for page in itertools.count():
        query = db.table(table).select(select)
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)
        rows = query.range(page * page_size, (page + 1) * page_size - 1).execute().data
        if transform:
            for row in rows:
                transform(row)
        results.extend(rows)
        if len(rows) < page_size:
            break
    return results
