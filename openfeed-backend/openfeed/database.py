import os
import json
import itertools
from uuid import UUID
from typing import Callable
from datetime import datetime, timedelta, timezone

from supabase import create_client, Client
from pydantic import BaseModel, Json, Field

from openfeed.database_models import (
    PublicGlobalFeeds,
    PublicGlobalArticles,
    PublicUserInterests,
)


class MatchArticlesResult(BaseModel):
    article_id: UUID = Field(alias="id")
    similarity_score: float = Field(alias="similarity")


class UserArticle(PublicGlobalArticles):
    is_read: bool


class UserInterest(BaseModel):
    id: str
    query: str


MAX_ARTICLES_PER_INTEREST = 20


def client() -> Client:
    url: str = os.getenv("SUPABASE_PROJECT_URL", "")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)


def get_global_feeds(db: Client) -> list[PublicGlobalFeeds]:
    rows = _paginated_query(db, "global_feeds")
    return [PublicGlobalFeeds.model_validate(r) for r in rows]


def get_global_articles(
    db: Client, num_records: int, page_num: int
) -> list[PublicGlobalArticles]:
    rows = (
        db.table("global_articles")
        .select("*")
        .range(page_num * num_records, (page_num + 1) * num_records - 1)
        .execute()
        .data
    )
    for row in rows:
        _decode_embeddings(row)
    return [PublicGlobalArticles.model_validate(r) for r in rows]


def get_global_article_urls(db: Client) -> list[str]:
    rows = _paginated_query(db, "global_articles", select="url")
    return [r["url"] for r in rows]


def get_global_articles_by_id(
    db: Client, article_ids: set[UUID]
) -> list[PublicGlobalArticles]:
    ids = [str(aid) for aid in article_ids]
    rows = db.table("global_articles").select("*").in_("id", ids).execute().data
    for row in rows:
        _decode_embeddings(row)
    return [PublicGlobalArticles.model_validate(r) for r in rows]


def query_global_articles(
    db: Client, query_embeddings: list[float]
) -> list[MatchArticlesResult]:
    data = (
        db.rpc(
            "match_articles",
            {
                "query_embedding": query_embeddings,
                "match_count": MAX_ARTICLES_PER_INTEREST,
            },
        )
        .execute()
        .data
    )
    return [MatchArticlesResult.model_validate(r) for r in data]  # type: ignore


def delete_global_articles(db: Client):
    one_week_ago = (datetime.now(timezone.utc) - timedelta(weeks=1)).isoformat()
    db.table("global_articles").delete().lt("created_at", one_week_ago).execute()


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


def read_user_article(db: Client, user_id: str, article_id: str):
    db.table("user_articles").update({"is_read": True}).eq("user_id", user_id).eq(
        "article_id", article_id
    ).execute()


def get_user_interests(db: Client) -> list[PublicUserInterests]:
    rows = _paginated_query(db, "user_interests", transform=_decode_embeddings)
    return [PublicUserInterests.model_validate(r) for r in rows]


def get_user_interests_for_user(db: Client, user_id: str) -> list[UserInterest]:
    rows = _paginated_query(
        db,
        "user_interests",
        select="id, created_at, query, user_id",
        filters={"user_id": user_id},
    )
    return [UserInterest.model_validate(r) for r in rows]


def insert_global_articles(db: Client, articles: list[PublicGlobalArticles]):
    db.table("global_articles").insert(
        [a.model_dump(mode="json") for a in articles]
    ).execute()


def add_user_interest(
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


### private ###


def _decode_embeddings(row: Json) -> None:
    """Deserialize the embeddings field in-place, if present."""
    if (raw := row.get("embeddings")) is not None:
        row["embeddings"] = json.loads(raw)


def _paginated_query(
    db: Client,
    table: str,
    *,
    select: str = "*",
    filters: dict[str, str] | None = None,
    page_size: int = 1000,
    transform: Callable[[Json], None] | None = None,
) -> list[dict]:
    """Fetch all rows from a table with automatic pagination."""
    results = []
    for page in itertools.count():
        query = db.table(table).select(select)
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)
        rows = query.range(page * page_size, (page + 1) * page_size - 1).execute().data
        if transform:
            for row in rows:
                transform(row)
        results.extend(rows)
        if len(rows) < page_size:
            break
    return results
