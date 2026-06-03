import logging

from pydantic import BaseModel

from openfeed.clients.ner import extract_entities
from openfeed.clients.openai_client import OpenAIClient, Message
from openfeed.db.models import PublicGlobalTopics
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
        self._embedding_client = OpenAIClient(
            model="gpt-5.4-mini",
        )

    def enrich_articles(
        self,
        articles: list[str],
        topics: list[PublicGlobalTopics],
    ) -> list[ArticleMetadata]:
        topic_list = format_topics_for_prompt(topics)
        classifier_client = OpenAIClient(
            model="gpt-5.4-mini",
            prompt_cache_key="article-enrich-v6",
            instructions=Message(
                role="system",
                content=_SYSTEM_PROMPT_TEMPLATE.format(topic_list=topic_list),
            ),
        )
        messages_batch = [[Message(role="user", content=text)] for text in articles]
        responses = classifier_client.generate_responses(
            messages_batch, _EnrichmentResponse, batch_size=3
        )
        summaries = [r.summary for r in responses if r.summary]
        embeddings_by_summary: dict[str, list[float]] = {}
        if summaries:
            emb_resp = self._embedding_client.embed(summaries)
            embeddings_by_summary = dict(zip(summaries, emb_resp.embeddings))

        return [
            ArticleMetadata(
                summary=r.summary,
                significance_score=topic_significance_score(r.topics, topics),
                entities=extract_entities(r.summary) if r.summary else [],
                summary_embeddings=(
                    embeddings_by_summary.get(r.summary) if r.summary else None
                ),
                topics=to_topic_payload(r.topics, topics),
            )
            for r in responses
        ]


_SYSTEM_PROMPT_TEMPLATE = """\
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

Classify each article into relevant topic IDs from this fixed set.

Topic list (ordered by priority, highest to lowest):
{topic_list}

Interpretation of priority:
- Priority affects selection order when multiple topics are directly relevant
- Priority does not override relevance; never include a topic unless it directly pertains to the article

Input handling:
- If there is meaningful text to classify, classify it
- Return [] only when content is unusable for classification (for example empty or nonsensical text)

Classification process:
1. Read the full text and identify the core subject.
2. Evaluate topics in priority order, highest to lowest.
3. Mark a topic as eligible only if the article directly pertains to it.
4. Build the output from eligible topics, preserving priority order.
5. Apply centrality check:
    - Keep a topic only if removing it would materially change the article's core meaning.
    - Exclude background, incidental mentions, weak implications, and tangential context.
6. Apply count limits:
    - Default to 1 topic.
    - Use 2 only when both are independently core.
    - Use 3 only when all three are independently core and non-redundant.
7. Final validation:
    - Every item must be a valid topic ID from the fixed list.
    - Output only topic IDs.
    - No duplicates.
    - If confidence is low, return fewer topics, not broader ones.

Ambiguity handling:
- If uncertain whether a topic is directly relevant, exclude it.
- If multiple eligible topics are direct and core, keep the higher-priority ones first.

General examples:
- An entry centered on corporate funding tied to a new technical platform can include both business and technology.
- An entry centered on criminal misuse of a technical system can include both justice-related and technology-related topics.
- An entry centered on technology but with explicit mentions of political terms or groups is both technological and political.
- An entry centered on athletics but in relation to a healthcare product is both sport and health related.
- An entry with a personal narrative frame should still use the topic tied to the underlying core development.

"""
