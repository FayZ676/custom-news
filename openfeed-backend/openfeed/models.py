import time as _time
from datetime import datetime, timezone
from html.parser import HTMLParser
from email.utils import parsedate_to_datetime

from pydantic import BaseModel, field_validator, model_validator, model_serializer


class _HTMLStripper(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def get_text(self) -> str:
        return " ".join(self._parts).strip()


def _strip_html(text: str) -> str:
    stripper = _HTMLStripper()
    stripper.feed(text)
    return stripper.get_text()


class ArticleContent(BaseModel):
    type: str
    base: str
    value: str | None
    language: str | None

    @field_validator("value", mode="before")
    @classmethod
    def clean_html_fields(cls, v: str) -> str | None:
        if v is None:
            return None
        return _strip_html(v) or None


class Article(BaseModel):
    title: str
    link: str
    published: datetime
    summary: str | None = None
    description: str | None = None
    content: list[ArticleContent] | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_published(cls, data: object) -> object:
        if isinstance(data, dict) and "published" not in data:
            if "updated" in data:
                data["published"] = data["updated"]
            elif "updated_parsed" in data:
                data["published"] = data["updated_parsed"]
        return data

    @field_validator("published", mode="before")
    @classmethod
    def parse_rfc2822_date(cls, v: object) -> datetime:
        if isinstance(v, str):
            try:
                return parsedate_to_datetime(v)
            except Exception:
                return datetime.fromisoformat(v)
        if isinstance(v, _time.struct_time):
            return datetime(*v[:6], tzinfo=timezone.utc)
        return v  # type: ignore[return-value]

    @field_validator("summary", "description", mode="before")
    @classmethod
    def clean_html_fields(cls, v: str) -> str | None:
        if v is None:
            return None
        return _strip_html(v) or None

    def __str__(self) -> str:
        parts = [self.title]
        if self.description:
            parts.append(self.description)
        if self.summary:
            parts.append(self.summary)
        if self.content is not None:
            parts.extend(item.value for item in self.content if item.value is not None)
        return "\n\n".join(parts)


class ArticleEmbeddings(BaseModel):
    feed_id: str
    article: Article
    embeddings: list[float]
    embeddings_model: str

    @model_serializer
    def serialize_to_global_articles_schema(self) -> dict:
        content_parts = [
            item.value
            for item in (self.article.content or [])
            if item.value is not None
        ]
        return {
            "feed_id": self.feed_id,
            "title": self.article.title,
            "url": self.article.link,
            "summary": self.article.summary,
            "content": "\n\n".join(content_parts) or None,
            "published_at": self.article.published.isoformat(),
            "embeddings": self.embeddings,
            "embedding_model": self.embeddings_model,
        }


class UpdateUserArticlesScoresRequest(BaseModel):
    user_id: str
    interest_id: str
    interest_embeddings: list[float]
