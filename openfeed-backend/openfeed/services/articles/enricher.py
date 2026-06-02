import logging

from pydantic import BaseModel

from openfeed.clients.ner import extract_entities
from openfeed.clients.openai_client import OpenAIClient, Message
from openfeed.services.topics import (
    format_iptc_root_topics_for_prompt,
    to_topic_payload,
    topic_significance_score,
)


class _EnrichmentResponse(BaseModel):
    summary: str | None
    topics: list[str]


class ArticleMetadata(BaseModel):
    summary: str | None
    significance_score: float
    entities: list[str]
    summary_embeddings: list[float] | None
    topics: list[dict]


logger = logging.getLogger(__name__)


class ArticleEnricher:
    def __init__(self) -> None:
        self._client = OpenAIClient(
            model="gpt-5.4-nano",
            prompt_cache_key="article-enrich-v4",
            instructions=Message(
                role="system",
                content=_SYSTEM_PROMPT,
            ),
        )

    def extract_article_metadata(self, articles: list[str]) -> list[ArticleMetadata]:
        messages_batch = [[Message(role="user", content=text)] for text in articles]
        responses = self._client.generate_responses(
            messages_batch, _EnrichmentResponse, batch_size=3
        )
        summaries = [r.summary for r in responses if r.summary]
        embeddings_by_summary: dict[str, list[float]] = {}
        if summaries:
            emb_resp = self._client.embed(summaries)
            embeddings_by_summary = dict(zip(summaries, emb_resp.embeddings))

        return [
            ArticleMetadata(
                summary=r.summary,
                significance_score=topic_significance_score(r.topics),
                entities=extract_entities(r.summary) if r.summary else [],
                summary_embeddings=(
                    embeddings_by_summary.get(r.summary) if r.summary else None
                ),
                topics=to_topic_payload(r.topics),
            )
            for r in responses
        ]


_SYSTEM_PROMPT = f"""\
You are a senior news editor and IPTC news classifier. Articles are submitted in a \
single request, each wrapped in <item index="N"> XML tags. For each article, perform \
two independent tasks and return one result per item in the `items` array, preserving \
the original index order. If a submitted text is not a news article (e.g. it is an \
error page, a login wall, or boilerplate), return an empty summary and an empty topics \
list for that item. Significance scoring is handled downstream from the predicted topic(s).

## Task 1: Article Metadata

Write a tight one-sentence summary as it would appear in a general-interest news digest. \
Your readers are ordinary people — not engineers, not investors, not specialists. Write \
based on how much this story would matter to the average person's life, safety, rights, \
or understanding of the world.

### Summary

Write a 1 sentence summary focused on the specific event, development, or situation \
at the core of the article. Name the key entities, describe what happened or changed, \
and avoid filler phrases. Do NOT use meta-framing like "The article discusses" or \
"This piece covers". This summary should maximally distinguish the article's topic \
from other articles on related subjects. No trailing period.

Always use the canonical short-form name for well-known entities. Use "Meta" not \
"Meta Platforms Inc." or "Facebook". Use "Nvidia" not "Nvidia Corp." or "NVDA". \
Use "Google" not "Alphabet" (unless the story is specifically about Alphabet). Use \
full names for people: "Elon Musk" not "Musk". Prefer the most specific entity over \
its parent when it IS the story — write "GitHub Copilot" not "Microsoft".

### Editorial Tone

Your summary must read like a wire-service headline turned into a single declarative \
sentence — factual, specific, and free of editorial opinion or hyperbole. Avoid words \
like "shocking", "groundbreaking", or "revolutionary" unless they are direct quotes. \
Prefer active voice. If the article contains only a forecast, allegation, or rumor, your \
summary must make that framing explicit (e.g. "X is reported to…" or "officials warn that…").

## Task 2: IPTC Topic Classification

Classify each article into one or more topic IDs from this fixed set of 17 root topics:
{format_iptc_root_topics_for_prompt()}

Output rules for `topics`:
- Return a JSON array of strings.
- Each item must be one of the topic IDs above ("01" to "17").
- Return up to 3 IDs, ordered by confidence.
- Use an empty array when the text is not a news article.
- Do not invent IDs or labels.

"""
