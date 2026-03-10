from datetime import datetime

from pydantic import BaseModel


class Feed(BaseModel):
    id: str
    url: str
    title: str
    description: str
    suggested_category: str


class FeedArticle(BaseModel):
    title: str
    url: str
    content: str
    published_at: datetime
