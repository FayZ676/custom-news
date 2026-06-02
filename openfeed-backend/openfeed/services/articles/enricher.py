import logging

from pydantic import BaseModel

from openfeed.clients.ner import extract_entities
from openfeed.clients.openai_client import OpenAIClient, Message
from openfeed.services.topics import (
    format_topics_for_prompt,
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

    def enrich_articles(self, articles: list[str]) -> list[ArticleMetadata]:
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
# Instructions

You are a senior news editor and topic classifier.

For each submitted article, produce one output item with two independent fields:
1. `summary`: one sentence for a general-interest news digest.
2. `topics`: root topic IDs from the fixed list below.

If the text is not a news article (error page, login wall, boilerplate, etc.), return:
- `summary`: empty string
- `topics`: []

## Rules

### Summary rules

- Exactly 1 sentence. No trailing period.
- Focus on the central event/development/situation.
- Name key entities and state what happened/changed.
- No meta-framing (avoid: "The article discusses", "This piece covers").
- Style: factual, specific, declarative, active voice, no hype/opinion.
- If content is forecast/allegation/rumor, make that uncertainty explicit.

Entity naming:
- Use the most widely recognized current name for organizations or products.
- Avoid formal legal names, stock tickers, old brand names, or parent-company names unless they are central to the story.
- Use full person names rather than surnames alone when possible.
- Prefer the most specific entity when it is the story rather than a broader parent organization.

### Topic classification rules

Classify each article into its relevant topic IDs from this fixed set:

> The topics are ordered from most significant (top) to least significant (bottom). Keep this in mind when classifying.

{format_topics_for_prompt()}

Topic classification steps:
1. Read the full article and identify the single core news event or development.
3. From the topic list, create a candidate set of IDs that directly describe that core event.
4. For each candidate, consider centrality:
    - If the article would still mean the same thing without that topic, exclude it.
    - If the topic is only background context, side detail, geography, or consequence, exclude it.
    - Keep only topics that are indispensable to the article's main subject.
5. Resolve overlaps using specificity:
    - Prefer the most specific fitting topic over a broader umbrella topic.
    - If two topics both seem central, include both only if each captures a distinct core facet.
6. Apply strict count limits:
    - Default to exactly 1 topic.
    - Use 2 only when both are independently central.
    - Use 3 only when all three are undeniably core and non-redundant.
7. Rank selected IDs by confidence (highest first).
8. Final validation pass before output:
    - Every ID must be from the fixed list.
    - No tangential, weak, speculative, or inferred-only topics.
    - If confidence is low, return fewer topics.
    - If nothing is clearly central, return [].

Ambiguity handling:
- When in doubt between two topics, choose the more specific one.
- When in doubt between include vs exclude, exclude.
- Never use topical breadth to "cover possibilities".

"""
