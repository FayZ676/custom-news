from itertools import islice
from uuid import UUID

from openfeed.db.client import Client

_CHUNK_SIZE = 100


def _chunked(iterable, size):
    it = iter(iterable)
    while chunk := list(islice(it, size)):
        yield chunk


def insert_article_topics(
    db: Client,
    article_id: UUID,
    topics: list[dict[str, str]],
) -> None:
    """Insert classified IPTC topics for a single article into global_article_topics.

    Args:
        topics: list of dicts with keys 'id' and 'name'.
    """
    if not topics:
        return

    rows = [
        {
            "article_id": str(article_id),
            "medtop_id": t["id"],
            "medtop_name": t["name"],
        }
        for t in topics
    ]
    db.table("global_article_topics").insert(rows).execute()


def get_article_topics_for_articles(
    db: Client,
    article_ids: list[UUID],
) -> dict[UUID, set[tuple[str, str]]]:
    """Return a mapping of article_id → set of (medtop_id, medtop_name) pairs.

    Articles with no topics are omitted from the result.
    """
    if not article_ids:
        return {}

    result: dict[UUID, set[tuple[str, str]]] = {}
    for chunk in _chunked(article_ids, _CHUNK_SIZE):
        response = (
            db.table("global_article_topics")
            .select("article_id, medtop_id, medtop_name")
            .in_("article_id", [str(aid) for aid in chunk])
            .execute()
        )
        for row in response.data:
            aid = UUID(row["article_id"])
            result.setdefault(aid, set()).add((row["medtop_id"], row["medtop_name"]))
    return result
