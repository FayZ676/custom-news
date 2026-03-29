from uuid import UUID

from openfeed.db.client import Client
from openfeed.database_models import PublicGlobalArticles
from openfeed.db.global_articles import get_global_articles_by_id, query_global_articles


class UserArticle(PublicGlobalArticles):
    is_read: bool


def get_user_articles_for_interest(
    db: Client, user_id: str, interest_id: str
) -> list[UserArticle]:
    rows = (
        db.table("user_articles")
        .select("article_id, is_read")
        .eq("user_id", str(user_id))
        .eq("interest_id", str(interest_id))
        .execute()
        .data
    )
    is_read_map = {UUID(r["article_id"]): r["is_read"] for r in rows}  # type: ignore
    articles = get_global_articles_by_id(db, set(is_read_map.keys()))
    return [
        UserArticle.model_validate(
            {**article.model_dump(), "is_read": is_read_map[article.id]}
        )
        for article in articles
    ]


def read_user_articles(db: Client, user_id: str, article_ids: list[str]):
    db.table("user_articles").update({"is_read": True}).eq("user_id", user_id).in_(
        "article_id", article_ids
    ).execute()


def insert_user_articles(
    db: Client, user_id: UUID, interest_id: UUID, interest_embeddings: list[float]
):
    top_articles = query_global_articles(db, interest_embeddings)
    scores = [
        {
            "user_id": str(user_id),
            "interest_id": str(interest_id),
            "article_id": str(a.article_id),
            "score": a.similarity_score,
        }
        for a in top_articles
    ]

    if scores:
        db.table("user_articles").upsert(
            scores,
            on_conflict="user_id,interest_id,article_id",
        ).execute()
