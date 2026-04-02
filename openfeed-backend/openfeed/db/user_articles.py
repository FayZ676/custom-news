import logging
from dataclasses import dataclass

from openfeed.reranker import rerank
from openfeed.db.client import Client
from openfeed.db.utils import paginated_query

from openfeed.db.global_articles import query_global_articles, MAX_ARTICLES_PER_INTEREST
from openfeed.database_models import (
    PublicUserInterests,
    PublicEmailNotificationFrequency,
)

logger = logging.getLogger(__name__)


@dataclass
class UserArticleDetails:
    user_id: str
    email: str
    title: str
    interest: str
    interest_id: str


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


def get_unread_user_article_details_for_users_with_notifications(
    db: Client,
    frequency: PublicEmailNotificationFrequency,
):
    settings_rows = (
        db.table("user_settings")
        .select("user_id")
        .eq("email_notification", True)
        .eq("email_notification_frequency", frequency)
        .execute()
        .data
    )

    if not settings_rows:
        return []

    user_ids = [str(row["user_id"]) for row in settings_rows]  # type: ignore

    pages = paginated_query(
        db=db,
        table="user_articles",
        select="user_id, interest_id, is_read, global_articles(title), user_interests(query)",
        filters={
            "is_read": False,
        },
        in_filters={
            "user_id": user_ids,
        },
    )
    return [
        UserArticleDetails(
            user_id=row["user_id"],
            email=db.auth.admin.get_user_by_id(str(row["user_id"])).user.email,  # type: ignore
            title=row.get("global_articles", {}).get("title", ""),
            interest=row.get("user_interests", {}).get("query", ""),
            interest_id=row["interest_id"],
        )
        for page in pages
        for row in page
    ]
