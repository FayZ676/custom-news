from datetime import datetime, timedelta, timezone

from openfeed.db.client import Client
from openfeed.db.models import PublicGlobalArticles
from openfeed.db.utils import paginated_query


def get_global_articles(db: Client) -> list[PublicGlobalArticles]:
    return [
        PublicGlobalArticles.model_validate(r)
        for page in paginated_query(db, "global_articles")
        for r in page
    ]


def get_recent_global_articles(
    db: Client, window_hours: int
) -> list[PublicGlobalArticles]:
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=window_hours)).isoformat()
    return [
        PublicGlobalArticles.model_validate(r)
        for page in paginated_query(
            db, "global_articles", gte_filters={"published_at": cutoff}
        )
        for r in page
    ]


def get_global_article_urls(db: Client) -> list[str]:
    return [
        r["url"]
        for page in paginated_query(db, "global_articles", select="url")
        for r in page
    ]


def insert_global_articles(db: Client, articles: list[PublicGlobalArticles]):
    db.table("global_articles").insert(
        [a.model_dump(mode="json") for a in articles]
    ).execute()


def delete_global_articles(db: Client, ttl: timedelta):
    cutoff = (datetime.now(timezone.utc) - ttl).isoformat()
    db.table("global_articles").delete().lt("published_at", cutoff).execute()
