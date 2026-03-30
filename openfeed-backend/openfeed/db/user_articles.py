import logging

from openfeed.reranker import rerank
from openfeed.db.client import Client
from openfeed.database_models import PublicUserInterests
from openfeed.db.global_articles import query_global_articles, MAX_ARTICLES_PER_INTEREST

logger = logging.getLogger(__name__)


def batch_insert_user_articles(db: Client, interests: list[PublicUserInterests]):
    all_scores: list[dict] = []
    for interest in interests:
        try:
            candidates = query_global_articles(
                db, interest.embeddings, match_count=MAX_ARTICLES_PER_INTEREST * 2
            )

            if not candidates:
                continue

            reranked = rerank(interest.query, [c.document_text for c in candidates])
            top_reranked = sorted(
                reranked, key=lambda r: r.relevance_score, reverse=True
            )[:MAX_ARTICLES_PER_INTEREST]
            all_scores.extend(
                {
                    "user_id": str(interest.user_id),
                    "interest_id": str(interest.id),
                    "article_id": str(candidates[r.index].article_id),
                    "score": r.relevance_score,
                }
                for r in top_reranked
            )
        except (OSError, RuntimeError) as e:
            logger.exception(
                "Failed to query/rerank articles for interest %s (user %s): %s",
                interest.id,
                interest.user_id,
                e,
            )

    if all_scores:
        db.table("user_articles").upsert(
            all_scores,
            on_conflict="user_id,interest_id,article_id",
        ).execute()
