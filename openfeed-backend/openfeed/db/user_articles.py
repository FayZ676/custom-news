from uuid import UUID

from openfeed.db.client import Client
from openfeed.db.global_articles import query_global_articles


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
