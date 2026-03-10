from datetime import datetime
from email.utils import parsedate_to_datetime

from pydantic import BaseModel, field_validator


class Feed(BaseModel):
    id: str
    url: str
    title: str
    description: str
    suggested_category: str


class FeedArticle(BaseModel):
    title: str
    link: str
    summary: str
    published: datetime

    @field_validator("published", mode="before")
    @classmethod
    def parse_rfc2822_date(cls, v: object) -> datetime:
        if isinstance(v, str):
            try:
                return parsedate_to_datetime(v)
            except Exception:
                return datetime.fromisoformat(v)
        return v  # type: ignore[return-value]
