import logging
from datetime import datetime, timezone

import requests
from pydantic import BaseModel, Field, field_validator

from openfeed.config import settings

logger = logging.getLogger(__name__)

_LATEST_URL = "https://newsdata.io/api/1/latest"
_REQUEST_TIMEOUT_SECONDS = 30


class NewsDataArticle(BaseModel):
    title: str
    link: str
    description: str | None = None
    published: datetime = Field(alias="pubDate")
    image_url: str | None = None
    source_name: str

    @field_validator("published", mode="before")
    @classmethod
    def parse_utc_date(cls, v: object) -> object:
        # NewsData.io returns pubDate as a naive "YYYY-MM-DD HH:MM:SS" in UTC.
        if isinstance(v, str):
            return datetime.fromisoformat(v).replace(tzinfo=timezone.utc)
        return v

    def __str__(self) -> str:
        parts = [self.title]
        if self.description:
            parts.append(self.description)
        return "\n\n".join(parts)


def get_latest_articles(query: str) -> list[NewsDataArticle]:
    """Return the latest articles matching a search query (first page only)."""
    response = requests.get(
        _LATEST_URL,
        params={
            "apikey": settings.newsdata_api_key,
            "q": query,
            "language": "en",
            "removeduplicate": 1,
        },
        timeout=_REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    articles = []
    for result in response.json().get("results", []):
        try:
            articles.append(NewsDataArticle.model_validate(result))
        except Exception as e:
            logger.warning("Failed to parse NewsData result: %s\n%s", e, result)
    if not articles:
        logger.warning("NewsData returned no articles for query: %r", query)
    return articles
