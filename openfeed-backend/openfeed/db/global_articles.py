from uuid import UUID
from datetime import datetime, timezone, timedelta

from pydantic import BaseModel, Field

from openfeed.db.client import Client
from openfeed.db.utils import _decode_embeddings, _paginated_query
from openfeed.database_models import PublicGlobalArticles


MAX_ARTICLES_PER_INTEREST = 20


class MatchArticlesResult(BaseModel):
    article_id: UUID = Field(alias="id")
    similarity_score: float = Field(alias="similarity")


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


def insert_global_articles(db: Client, articles: list[PublicGlobalArticles]):
    db.table("global_articles").insert(
        [a.model_dump(mode="json") for a in articles]
    ).execute()
