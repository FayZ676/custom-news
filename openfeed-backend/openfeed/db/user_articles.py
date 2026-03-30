import logging

from openfeed.db.client import Client
from openfeed.database_models import PublicUserInterests
from openfeed.db.global_articles import query_global_articles

logger = logging.getLogger(__name__)


def batch_insert_user_articles(db: Client, interests: list[PublicUserInterests]) -> int:
    all_scores: list[dict] = []
    processed = 0

    for interest in interests:
        try:
            top_articles = query_global_articles(db, interest.embeddings)
            all_scores.extend(
                {
                    "user_id": str(interest.user_id),
                    "interest_id": str(interest.id),
                    "article_id": str(a.article_id),
                    "score": a.similarity_score,
                }
                for a in top_articles
            )
            processed += 1
        except (OSError, RuntimeError) as e:
            logger.exception(
                "Failed to query articles for interest %s (user %s): %s",
                interest.id,
                interest.user_id,
                e,
            )

    if all_scores:
        db.table("user_articles").upsert(
            all_scores,
            on_conflict="user_id,interest_id,article_id",
        ).execute()

    return processed
