from uuid import UUID
from typing import Optional
from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field

from openfeed.db.client import Client
from openfeed.database_models import PublicGlobalArticles
from openfeed.db.utils import decode_embeddings, paginated_query


MAX_ARTICLES_PER_INTEREST = 20


class MatchStoriesResult(BaseModel):
    story_id: UUID = Field(alias="id")
    headline: str = Field(alias="headline")
    summary: Optional[str] = Field(alias="summary", default=None)
    similarity_score: float = Field(alias="similarity")

    @property
    def document_text(self) -> str:
        parts = [self.headline]
        if self.summary:
            parts.append(self.summary)
        return ". ".join(parts)


def get_global_articles(db: Client) -> list[PublicGlobalArticles]:
    return [
        PublicGlobalArticles.model_validate(r)
        for page in paginated_query(db, "global_articles", transform=decode_embeddings)
        for r in page
    ]


def get_recent_global_articles(
    db: Client, window_hours: int
) -> list[PublicGlobalArticles]:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=window_hours)).isoformat()
    return [
        PublicGlobalArticles.model_validate(r)
        for page in paginated_query(
            db,
            "global_articles",
            gte_filters={"published_at": cutoff},
            transform=decode_embeddings,
        )
        for r in page
    ]


def get_global_article_urls(db: Client) -> list[str]:
    return [
        r["url"]
        for page in paginated_query(db, "global_articles", select="url")
        for r in page
    ]


def query_global_stories(
    db: Client,
    query_embeddings: list[float],
    match_count: int,
    min_similarity: float,
) -> list[MatchStoriesResult]:
    data = (
        db.rpc(
            "match_stories",
            {
                "query_embedding": query_embeddings,
                "match_count": match_count,
                "min_similarity": min_similarity,
            },
        )
        .execute()
        .data
    )
    return [MatchStoriesResult.model_validate(r) for r in data]  # type: ignore


def insert_global_articles(db: Client, articles: list[PublicGlobalArticles]):
    db.table("global_articles").insert(
        [a.model_dump(mode="json") for a in articles]
    ).execute()


def delete_global_articles(db: Client, ttl: timedelta):
    cutoff = (datetime.now(timezone.utc) - ttl).isoformat()
    db.table("global_articles").delete().lt("published_at", cutoff).execute()
