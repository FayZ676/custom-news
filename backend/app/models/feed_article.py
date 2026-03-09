from datetime import datetime

from pydantic import BaseModel


class FeedArticle(BaseModel):
    title: str
    url: str
    content: str
    published_at: datetime
