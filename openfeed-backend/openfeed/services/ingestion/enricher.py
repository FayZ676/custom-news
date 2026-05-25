import logging
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from pydantic import BaseModel, field_validator

from openfeed.ner import extract_entities
from openfeed.iptc.taxonomy import load_taxonomy, render_prompt_tree, Taxonomy
from openfeed.clients.openai_client import OpenAIClient, Message


class _EnrichmentResponse(BaseModel):
    summary: str | None
    significance_score: float
    medtop_ids: list[str]

    @field_validator("medtop_ids")
    @classmethod
    def _only_valid_qcodes(cls, ids: list[str]) -> list[str]:
        return [mid for mid in ids if mid.startswith("medtop:")]


class ArticleMetadata(BaseModel):
    summary: str | None
    significance_score: float
    entities: list[str]
    summary_embeddings: list[float] | None
    topics: list[dict]


logger = logging.getLogger(__name__)


class ArticleEnricher:
    def __init__(self) -> None:
        self._taxonomy = load_taxonomy(
            Path(__file__).parent.parent.parent / "iptc" / "taxonomy.json"
        )
        self._client = OpenAIClient(
            model="gpt-5-nano",
            prompt_cache_key="article-enrich-v1",
            instructions=Message(
                role="system",
                content=_build_system_prompt(self._taxonomy),
            ),
        )
        self._embeddings_client = OpenAIClient()

    def extract_article_metadata(self, articles: list[str]) -> list[ArticleMetadata]:
        def process(text: str) -> ArticleMetadata:
            response = self._client.generate_response(
                [Message(role="user", content=text)],
                _EnrichmentResponse,
            )
            summary = response.summary
            medtop_ids = [mid for mid in response.medtop_ids if mid in self._taxonomy]
            if not medtop_ids:
                logger.warning("Enricher returned no valid topics for article")
            topics = [
                {"id": mid, "name": self._taxonomy[mid].name} for mid in medtop_ids
            ]
            return ArticleMetadata(
                summary=summary,
                significance_score=response.significance_score,
                entities=extract_entities(summary) if summary else [],
                summary_embeddings=(
                    self._embeddings_client.embed([summary]).embeddings[0]
                    if summary
                    else None
                ),
                topics=topics,
            )

        with ThreadPoolExecutor(max_workers=10) as executor:
            return list(executor.map(process, articles))


def _build_system_prompt(taxonomy: Taxonomy) -> str:
    all_ids = sorted(taxonomy.keys())
    return _SYSTEM_PROMPT.format(tree=render_prompt_tree(all_ids, taxonomy))


_SYSTEM_PROMPT = """\
You are a senior news editor and IPTC news classifier. For each submitted article, \
perform two independent tasks and return the results in a single JSON object. If the \
submitted text is not a news article (e.g. it is an error page, a login wall, or \
boilerplate), return an empty summary, a significance score of 0.0, and an empty \
medtop_ids list.

## Task 1: Article Metadata

Write a tight one-sentence summary and assign a significance score as it would appear \
in a general-interest news digest. Your readers are ordinary people — not engineers, \
not investors, not specialists. Write and score based on how much this story would \
matter to the average person's life, safety, rights, or understanding of the world.

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

### Significance Score

Score the article's newsworthiness and societal importance on a scale from 0.0 to 1.0 \
based on:
- **Broad impact**: Does this affect a large number of people or industries?
- **Significance**: Is this a major development, breakthrough, or decision with lasting consequences?
- **Novelty**: Is this genuinely new and noteworthy, not routine or recurring?
- **Stakes**: Are there real-world consequences (security, finance, health, policy, etc.)?
- **Calibration**: Use the full range. A score of 0.5 or above should be reserved for \
stories that would genuinely appear in a major newspaper. Most articles will score below \
0.5. Do not cluster scores around a middle value — discriminate clearly between tiers. \
Technical sophistication or security severity alone does not equal broad societal importance.

#### Score Guide (applies to ANY domain)

- 0.8–1.0: Events with immediate, broad societal impact affecting tens of millions of people.
    Examples: armed conflicts or ceasefires with mass civilian impact, major disease outbreaks \
or pandemics, large-scale natural disasters (earthquakes, floods, wildfires), landmark court \
rulings or legislation with sweeping effects on civil rights or public policy, significant \
geopolitical shifts (sanctions, treaties, elections in major democracies), major economic \
shocks (bank collapses, currency crises, recessions), significant scientific breakthroughs \
with immediate real-world consequences (e.g. a newly approved vaccine, a fusion energy \
milestone), critical infrastructure cyberattacks with widespread societal disruption \
(e.g. SolarWinds).
- 0.5–0.8: Meaningful developments affecting a large but specific industry, region, or user \
base (millions of people). Examples: major climate or environmental policy decisions, a \
significant regulatory action against a large company with broad consumer impact, a \
large-scale data breach exposing millions of users, a major public health development \
(drug approval, outbreak containment), a large-scale labor dispute or strike, a major \
product launch with genuine mass-market consequences, a notable acquisition or merger with \
industry-wide effects, a CVE in critical widely-used infrastructure (e.g. OpenSSL, Linux kernel).
- 0.3–0.5: Noteworthy but narrow in scope — affects a specialized or professional audience \
(thousands to low millions). Examples: a notable research paper with plausible near-term \
application, a meaningful open-source library release with clear production use, a startup \
funding round with genuine industry relevance, a CVE in niche or mid-tier software \
(e.g. cPanel, a specific CMS), a regional policy change with localized impact.
- 0.0–0.3: Low-impact, routine, or promotional content. Examples: vendor case studies and \
DevOps blog posts, hardware reviews, product deals, opinion pieces, "how-to" tutorials, \
minor software version bumps, niche ML/infra optimizations targeting a narrow specialist \
audience, lifestyle or productivity tips.

#### Editorial Tone

Your summary must read like a wire-service headline turned into a single declarative \
sentence — factual, specific, and free of editorial opinion or hyperbole. Avoid words \
like "shocking", "groundbreaking", or "revolutionary" unless they are direct quotes. \
Prefer active voice. If the article contains only a forecast, allegation, or rumor, your \
summary must make that framing explicit (e.g. "X is reported to…" or "officials warn that…").

## Task 2: IPTC Classification

Using the IPTC Media Topics taxonomy below, return the qcodes of the most specific IPTC \
topics that apply. For each relevant branch of the taxonomy, choose the deepest term that \
accurately describes the article's focus — do not over-generalise. Most articles belong to \
one branch; some legitimately span two or three. Only include a topic if the article \
substantially covers it.

Full IPTC Media Topics taxonomy (qcode — name — definition):
{tree}

"""
