import logging
from dataclasses import dataclass

from openfeed.reranker import rerank
from openfeed.db.client import Client
from openfeed.db.utils import paginated_query
from openfeed.database_models import PublicUserInterests
from openfeed.db.global_articles import query_global_articles, MAX_ARTICLES_PER_INTEREST

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


def get_unread_user_article_details(db: Client, user_ids_emails: dict[str, str]):
    pages = paginated_query(
        db=db,
        table="user_articles",
        select="user_id, interest_id, is_read, global_articles(title), user_interests(query)",
        filters={
            "is_read": False,
        },
        in_filters={
            "user_id": list(user_ids_emails.keys()),
        },
    )
    return [
        UserArticleDetails(
            user_id=row["user_id"],
            email=user_ids_emails[str(row["user_id"])],
            title=row.get("global_articles", {}).get("title", ""),
            interest=row.get("user_interests", {}).get("query", ""),
            interest_id=row["interest_id"],
        )
        for page in pages
        for row in page
    ]
