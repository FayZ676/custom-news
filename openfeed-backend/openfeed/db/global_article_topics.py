from uuid import UUID

from openfeed.db.client import Client


def insert_article_topics(
    db: Client,
    article_id: UUID,
    topics: list[str],
) -> None:
    """Insert classified IPTC topics for a single article into global_article_topics."""
    if not topics:
        return

    rows = [
        {
            "article_id": str(article_id),
            "medtop_id": t,
        }
        for t in topics
    ]
    db.table("global_article_topics").insert(rows).execute()


def get_article_topics_for_articles(
    db: Client,
    article_ids: list[UUID],
) -> dict[UUID, set[str]]:
    """Return a mapping of article_id → set of medtop_ids for the given articles.

    Articles with no topics are omitted from the result.
    """
    if not article_ids:
        return {}

    response = (
        db.table("global_article_topics")
        .select("article_id, medtop_id")
        .in_("article_id", [str(aid) for aid in article_ids])
        .execute()
    )
    result: dict[UUID, set[str]] = {}
    for row in response.data:
        aid = UUID(row["article_id"])
        result.setdefault(aid, set()).add(row["medtop_id"])
    return result
