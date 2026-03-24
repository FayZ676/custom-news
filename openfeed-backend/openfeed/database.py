import os

from supabase import create_client, Client

from openfeed.models import ArticleEmbeddings


MAX_ARTICLES_PER_INTEREST = 20


def client() -> Client:
    url: str = os.getenv("SUPABASE_PROJECT_URL", "")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)


def insert_global_articles(db: Client, articles: list[ArticleEmbeddings]):
    db.table("global_articles").insert(
        [a.model_dump(mode="json") for a in articles]
    ).execute()


def update_user_articles_scores(
    db: Client, user_id: str, interest_id: str, interest_embeddings: list[float]
):
    top_articles = (
        db.rpc(
            "match_articles",
            {
                "query_embedding": interest_embeddings,
                "match_count": MAX_ARTICLES_PER_INTEREST,
            },
        )
        .execute()
        .data
    )
    scores = [
        {
            "user_id": user_id,
            "interest_id": interest_id,
            "article_id": a["id"],
            "score": a["similarity"],
        }
        for a in top_articles  # type: ignore
    ]

    if scores:
        db.table("user_article_scores").upsert(
            scores,
            on_conflict="user_id,interest_id,article_id",
        ).execute()


def update_all_user_articles_scores(db: Client):
    user_interests = (
        db.table("user_interests").select("id, user_id, embeddings").execute()
    ).data
    for interest in user_interests:
        update_user_articles_scores(
            db, interest["user_id"], interest["id"], interest["embeddings"]  # type: ignore
        )
