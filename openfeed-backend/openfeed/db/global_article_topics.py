from uuid import UUID

from openfeed.db.client import Client
from openfeed.iptc.classifier import ClassifiedTopic


def insert_article_topics(
    db: Client,
    article_id: UUID,
    topics: list[ClassifiedTopic],
) -> None:
    """Insert classified IPTC topics for a single article into global_article_topics."""
    if not topics:
        return

    rows = [
        {
            "article_id": str(article_id),
            "medtop_id": t.medtop_id,
        }
        for t in topics
    ]
    db.table("global_article_topics").insert(rows).execute()
