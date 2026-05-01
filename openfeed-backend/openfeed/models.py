import uuid
import time as _time
from datetime import datetime, timezone
from html.parser import HTMLParser
from email.utils import parsedate_to_datetime

from pydantic import BaseModel, field_validator, model_validator

from openfeed.database_models import PublicGlobalArticles


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


class EntitiesResponse(BaseModel):
    summary: str
    entities: list[str]
    significance_score: float


class ArticleMetadata(EntitiesResponse):
    summary_embeddings: list[float]


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

    def to_db_schema(
        self,
        feed_title: str,
        metadata: ArticleMetadata,
    ):
        return PublicGlobalArticles(
            content="\n\n".join([v.value for v in self.content or [] if v.value])
            or None,
            published_at=self.published,
            feed_title=feed_title,
            title=self.title,
            summary=metadata.summary,
            summary_embeddings=metadata.summary_embeddings,
            summary_entities=metadata.entities,
            significance_score=metadata.significance_score,
            url=self.link,
            id=uuid.uuid4(),
            created_at=datetime.now(),
        )
