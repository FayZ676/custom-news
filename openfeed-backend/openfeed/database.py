import os
import json
import itertools
from uuid import UUID
from typing import Callable
from datetime import datetime

from pydantic import BaseModel, Json
from supabase import create_client, Client

from openfeed.database_models import (
    PublicGlobalFeeds,
    PublicGlobalArticles,
    PublicUserInterests,
)


class Feed(BaseModel):
    id: str
    url: str
    title: str
    description: str
    created_at: datetime
    suggested_category: str | None = None


MAX_ARTICLES_PER_INTEREST = 20


def client() -> Client:
    url: str = os.getenv("SUPABASE_PROJECT_URL", "")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)


def get_global_feeds(db: Client) -> list[PublicGlobalFeeds]:
    rows = _paginated_query(db, "global_feeds")
    return [PublicGlobalFeeds.model_validate(r) for r in rows]


def get_global_article_urls(db: Client) -> list[str]:
    rows = _paginated_query(db, "global_articles", select="url")
    return [r["url"] for r in rows]


def get_user_interests(db: Client) -> list[PublicUserInterests]:
    rows = _paginated_query(db, "user_interests", transform=_decode_embeddings)
    return [PublicUserInterests.model_validate(r) for r in rows]


def insert_global_articles(db: Client, articles: list[PublicGlobalArticles]):
    db.table("global_articles").insert(
        [a.model_dump(mode="json") for a in articles]
    ).execute()


def add_user_interest(
    db: Client, user_id: UUID, interest_id: UUID, interest_embeddings: list[float]
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
            "user_id": str(user_id),
            "interest_id": str(interest_id),
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


def update_user_interests(db: Client):
    user_interests = get_user_interests(db)
    for interest in user_interests:
        add_user_interest(db, interest.user_id, interest.id, interest.embeddings)


### private ###


def _decode_embeddings(row: dict) -> None:
    """Deserialize the embeddings field in-place, if present."""
    if (raw := row.get("embeddings")) is not None:
        row["embeddings"] = json.loads(raw)


def _paginated_query(
    db: Client,
    table: str,
    *,
    select: str = "*",
    page_size: int = 1000,
    transform: Callable[[Json], None] | None = None,
) -> list[dict]:
    """Fetch all rows from a table with automatic pagination."""
    results = []
    for page in itertools.count():
        rows = (
            db.table(table)
            .select(select)
            .range(page * page_size, (page + 1) * page_size - 1)
            .execute()
            .data
        )
        if transform:
            for row in rows:
                transform(row)
        results.extend(rows)
        if len(rows) < page_size:
            break
    return results
