import logging

from pydantic import BaseModel

from openfeed.db.queries.global_article_metadata_options import (
    GlobalArticleMetadataOption,
)
from openfeed.clients.openai_client import OpenAIClient, Message


class ArticleMetadata(BaseModel):
    topic: str
    type: str
    coverage: str
    duration: str
    impact: str


logger = logging.getLogger(__name__)


class ArticleEnricher:
    def __init__(self) -> None:
        self._embedding_client = OpenAIClient(
            model="gpt-5.4-mini",
        )

    def enrich_articles(
        self,
        articles: list[str],
        metadata_options: dict[str, list[GlobalArticleMetadataOption]],
    ) -> list[ArticleMetadata]:
        classifier_client = OpenAIClient(
            model="gpt-5.4-mini",
            prompt_cache_key="article-enrich-v8",
            instructions=Message(
                role="system",
                content=_SYSTEM_PROMPT_TEMPLATE.format(
                    topic_list=_format_options(metadata_options, "topic"),
                    type_list=_format_options(metadata_options, "type"),
                    coverage_list=_format_options(metadata_options, "coverage"),
                    duration_list=_format_options(metadata_options, "duration"),
                    impact_list=_format_options(metadata_options, "impact"),
                ),
            ),
        )
        messages_batch = [
            [Message(role="user", content=_limit_article_words(text))]
            for text in articles
        ]
        return classifier_client.generate_responses(
            messages_batch, ArticleMetadata, batch_size=3
        )


_SYSTEM_PROMPT_TEMPLATE = """\
## Topic options

{topic_list}

## Types options

{type_list}

## Coverage options

{coverage_list}

## Duration options

{duration_list}

## Impact options

{impact_list}

---

## Instructions

Given an article, choose exactly one value for each field in `ArticleMetadata`.

- `topic` must be one of the topic labels above.
- `type`, `coverage`, `duration`, and `impact` must each be one of the labels listed in their respective sections.
- Prefer the smallest scope that still captures the article's main effect.
- Return only the structured fields; do not add extra commentary.

"""


def _format_options(
    metadata_options: dict[str, list[GlobalArticleMetadataOption]],
    field: str,
) -> str:
    options = metadata_options.get(field)
    if not options:
        raise ValueError(f"Missing article metadata options for field: {field}")
    return "\n".join(f"- {option.label}: {option.description}" for option in options)


def _limit_article_words(text: str, max_words: int = 180) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words])
