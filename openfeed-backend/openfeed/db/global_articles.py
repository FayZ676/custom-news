from uuid import UUID
from typing import Optional
from datetime import datetime, timezone, timedelta

from pydantic import BaseModel, Field

from openfeed.db.client import Client
from openfeed.db.utils import paginated_query
from openfeed.database_models import PublicGlobalArticles


MAX_ARTICLES_PER_INTEREST = 20


class MatchArticlesResult(BaseModel):
    article_id: UUID = Field(alias="id")
    title: str = Field(alias="title")
    summary: Optional[str] = Field(alias="summary", default=None)
    content: Optional[str] = Field(alias="content", default=None)
    similarity_score: float = Field(alias="similarity")

    @property
    def document_text(self) -> str:
        """Build a text representation for reranking."""
        parts = [self.title]
        if self.summary:
            parts.append(self.summary)
        elif self.content:
            parts.append(self.content)
        return ". ".join(parts)


def get_global_article_urls(db: Client) -> list[str]:
    return [
        r["url"]
        for page in paginated_query(db, "global_articles", select="url")
        for r in page
    ]


def query_global_articles(
    db: Client,
    query_embeddings: list[float],
    match_count: int = MAX_ARTICLES_PER_INTEREST,
) -> list[MatchArticlesResult]:
    data = (
        db.rpc(
            "match_articles",
            {
                "query_embedding": query_embeddings,
                "match_count": match_count,
            },
        )
        .execute()
        .data
    )
    return [MatchArticlesResult.model_validate(r) for r in data]  # type: ignore


def delete_global_articles(db: Client):
    one_week_ago = (datetime.now(timezone.utc) - timedelta(weeks=1)).isoformat()
    db.table("global_articles").delete().lt("created_at", one_week_ago).execute()


def insert_global_articles(db: Client, articles: list[PublicGlobalArticles]):
    db.table("global_articles").insert(
        [a.model_dump(mode="json") for a in articles]
    ).execute()
