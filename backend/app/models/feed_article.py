from datetime import datetime
from html.parser import HTMLParser
from email.utils import parsedate_to_datetime

from pydantic import BaseModel, field_validator


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


class Feed(BaseModel):
    id: str
    url: str
    title: str
    description: str
    suggested_category: str


class FeedArticleContent(BaseModel):
    type: str
    base: str
    value: str
    language: str | None

    @field_validator("value", mode="before")
    @classmethod
    def clean_html_fields(cls, v: str) -> str:
        return _strip_html(v)


class FeedArticle(BaseModel):
    title: str
    link: str
    published: datetime
    summary: str | None = None
    description: str | None = None
    content: list[FeedArticleContent] | None = None

    @field_validator("published", mode="before")
    @classmethod
    def parse_rfc2822_date(cls, v: object) -> datetime:
        if isinstance(v, str):
            try:
                return parsedate_to_datetime(v)
            except Exception:
                return datetime.fromisoformat(v)
        return v  # type: ignore[return-value]

    @field_validator("summary", "description", mode="before")
    @classmethod
    def clean_html_fields(cls, v: str) -> str | None:
        return _strip_html(v) or None

    def __str__(self) -> str:
        parts = [self.title]
        if self.description:
            parts.append(self.description)
        if self.summary:
            parts.append(self.summary)
        if self.content is not None:
            parts.extend(item.value for item in self.content)
        return "\n\n".join(parts)
