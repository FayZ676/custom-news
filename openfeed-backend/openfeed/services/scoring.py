import logging

from openfeed.db.client import Client
from openfeed.reranker import rerank
from openfeed.db.user_interests import get_user_interests
from openfeed.db.global_settings import get_global_settings
from openfeed.db.global_articles import query_global_stories


logger = logging.getLogger(__name__)


def score_articles(db: Client):
    global_settings = get_global_settings(db)
    all_scores: list[dict] = []
    for interests_page in get_user_interests(db):
        for interest in interests_page:
            try:
                candidates = query_global_stories(
                    db,
                    interest.embeddings,
                    match_count=global_settings.max_match_count,
                    min_similarity=global_settings.min_similarity_threshold,
                )

                if not candidates:
                    continue

                reranked = rerank(interest.query, [c.document_text for c in candidates])
                all_scores.extend(
                    {
                        "user_id": str(interest.user_id),
                        "interest_id": str(interest.id),
                        "story_id": str(candidates[r.index].story_id),
                        "score": r.relevance_score,
                    }
                    for r in reranked
                )
            except (OSError, RuntimeError) as e:
                logger.exception(
                    "Failed to query/rerank stories for interest %s (user %s): %s",
                    interest.id,
                    interest.user_id,
                    e,
                )

    if all_scores:
        db.table("user_stories").upsert(
            all_scores,
            on_conflict="user_id,interest_id,story_id",
        ).execute()
