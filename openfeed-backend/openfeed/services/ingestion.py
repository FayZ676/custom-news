# TODO: Split up classification and enrichment into separate modules

import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta

import pytimeparse

from openfeed.db.client import Client, client
from openfeed.db.global_articles import (
    insert_global_articles,
    get_global_article_urls,
    delete_global_articles,
)
from openfeed.db.global_article_topics import insert_article_topics
from openfeed.models import Article, ArticleMetadata, SummaryResponse
from openfeed.ner import extract_entities
from openfeed.feed_parser import get_articles
from openfeed.db.global_feeds import get_global_feeds
from openfeed.db.global_settings import get_global_settings
from openfeed.iptc.classifiers.classifier import classify
from openfeed.iptc.taxonomy import load_taxonomy, load_taxonomy_index
from openfeed.openai_client import OpenAIClient, Message
from openfeed.database_models import PublicGlobalArticles

taxonomy = load_taxonomy(Path(__file__).parent.parent / "iptc" / "taxonomy.json")
taxonomy_index = load_taxonomy_index()

_METADATA_SYSTEM_PROMPT = """\
## Who You Are

You are a senior news editor at a general-interest daily newspaper with a global readership. Your job is to do two things for each submitted article: write a tight one-sentence summary as it would appear in a  news digest, and assign a significance score that determines whether the story makes the front page, a section, or the cutting room floor. Your readers are ordinary people — not engineers, not investors, not specialists. Write and score based on how much this story would matter to the average person's life, safety, rights, or understanding of the world.

## What You Do

For the article below, do the following:

1. Write a 1 sentence summary focused on the specific event, development, or situation at the core of the article. Name the key entities, describe what happened or changed, and avoid filler phrases. Do NOT use meta-framing like "The article discusses" or "This piece covers". This summary should maximally distinguish the article's topic from other articles on related subjects.
   - Always use the canonical short-form name for well-known entities. Use "Meta" not "Meta Platforms Inc." or "Facebook". Use "Nvidia" not "Nvidia Corp." or "NVDA". Use "Google" not "Alphabet" (unless the story is specifically about Alphabet). Use full names for people: "Elon Musk" not "Musk". Prefer the most specific entity over its parent when it IS the story — write "GitHub Copilot" not "Microsoft".
2. Score the article's newsworthiness and societal importance on a scale from 0.0 to 1.0 based on:
   - **Broad impact**: Does this affect a large number of people or industries?
   - **Significance**: Is this a major development, breakthrough, or decision with lasting consequences?
   - **Novelty**: Is this genuinely new and noteworthy, not routine or recurring?
   - **Stakes**: Are there real-world consequences (security, finance, health, policy, etc.)?
   - **Calibration**: Use the full range. A score of 0.5 or above should be reserved for stories that would genuinely appear in a major newspaper. Most articles will score below 0.5. Do not cluster scores around a middle value — discriminate clearly between tiers. Technical sophistication or security severity alone does not equal broad societal importance.

### Score Guide

Apply these criteria to ANY domain

- 0.8–1.0: Events with immediate, broad societal impact affecting tens of millions of people.
    Examples: armed conflicts or ceasefires with mass civilian impact, major disease outbreaks or pandemics, large-scale
    natural disasters (earthquakes, floods, wildfires), landmark court rulings or legislation with sweeping effects on
    civil rights or public policy, significant geopolitical shifts (sanctions, treaties, elections in major democracies),
    major economic shocks (bank collapses, currency crises, recessions), significant scientific breakthroughs with
    immediate real-world consequences (e.g. a newly approved vaccine, a fusion energy milestone), critical infrastructure
    cyberattacks with widespread societal disruption (e.g. SolarWinds).
- 0.5–0.8: Meaningful developments affecting a large but specific industry, region, or user base (millions of people).
    Examples: major climate or environmental policy decisions, a significant regulatory action against a large company
    with broad consumer impact, a large-scale data breach exposing millions of users, a major public health development
    (drug approval, outbreak containment), a large-scale labor dispute or strike, a major product launch with genuine
    mass-market consequences, a notable acquisition or merger with industry-wide effects, a CVE in critical widely-used
    infrastructure (e.g. OpenSSL, Linux kernel).
- 0.3–0.5: Noteworthy but narrow in scope — affects a specialized or professional audience (thousands to low millions).
    Examples: a notable research paper with plausible near-term application, a meaningful open-source library release
    with clear production use, a startup funding round with genuine industry relevance, a CVE in niche or mid-tier
    software (e.g. cPanel, a specific CMS), a regional policy change with localized impact.
- 0.0–0.3: Low-impact, routine, or promotional content.
    Examples: vendor case studies and DevOps blog posts, hardware reviews, product deals, opinion pieces, "how-to"
    tutorials, minor software version bumps, niche ML/infra optimizations targeting a narrow specialist audience,
    lifestyle or productivity tips."""

_metadata_client = OpenAIClient(
    model="gpt-5.4-nano",
    prompt_cache_key="article-metadata-v1",
    instructions=Message(role="system", content=_METADATA_SYSTEM_PROMPT),
)

_classify_client = OpenAIClient(
    model="gpt-5.4-nano",
    prompt_cache_key="iptc-classify-v1",
)

_embeddings_client = OpenAIClient()


logger = logging.getLogger(__name__)


def fetch_articles(db: Client):
    global_settings = get_global_settings(db)
    seen_urls = set(get_global_article_urls(db))
    feed_articles = _fetch_feed_articles(get_global_feeds(db))
    unique_found_articles: list[tuple[str, Article]] = []
    cutoff = datetime.now(timezone.utc) - _parse_ttl(global_settings.article_ttl)
    for feed_title, article in feed_articles:
        if article.link not in seen_urls and article.published >= cutoff:
            seen_urls.add(article.link)
            unique_found_articles.append((feed_title, article))

    article_metadata = extract_article_metadata(
        [str(article) for _, article in unique_found_articles]
    )
    articles: list[PublicGlobalArticles] = [
        article.to_db_schema(feed_title, metadata)
        for (feed_title, article), metadata in zip(
            unique_found_articles, article_metadata
        )
    ]

    if articles:
        insert_global_articles(db, articles)
        _classify_and_insert_topics(articles)

    logger.info("Fetched and inserted %d new articles", len(articles))

    return articles


def _fetch_feed_articles(feeds) -> list[tuple[str, Article]]:
    def _fetch_feed(feed) -> list[tuple[str, Article]]:
        return [(feed.title, article) for article in get_articles(feed.url)]

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(_fetch_feed, feeds)

    return [pair for feed_result in results for pair in feed_result]


def _classify_and_insert_topics(articles: list[PublicGlobalArticles]) -> None:
    def _process(article: PublicGlobalArticles) -> None:
        thread_db = client()
        text = "\n\n".join(filter(None, [article.title, article.summary]))
        medtop_ids = classify(text, taxonomy, taxonomy_index, _classify_client)
        topics = [
            {"id": mid, "name": taxonomy[mid].name}
            for mid in medtop_ids
            if mid in taxonomy
        ]
        insert_article_topics(thread_db, article.id, topics)

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(_process, article): article for article in articles}
        for future in as_completed(futures):
            article = futures[future]
            try:
                future.result()
            except Exception:
                logger.exception(
                    "Classification failed for article %s (%r) — skipping topics",
                    article.id,
                    article.title,
                )


def delete_old_articles(db: Client):
    global_settings = get_global_settings(db)
    ttl = _parse_ttl(global_settings.article_ttl)
    delete_global_articles(db, ttl)
    logger.info("Deleted articles older than %s", global_settings.article_ttl)


def _parse_ttl(article_ttl: str) -> timedelta:
    seconds = pytimeparse.parse(article_ttl)
    if seconds is None:
        raise ValueError(f"Unable to parse TTL string: {article_ttl!r}")
    return timedelta(seconds=seconds)


def extract_article_metadata(
    articles: list[str],
) -> list[ArticleMetadata]:
    def process(text: str) -> ArticleMetadata:
        response = _metadata_client.generate_response(
            [Message(role="user", content=text)],
            SummaryResponse,
        )
        return ArticleMetadata(
            entities=extract_entities(response.summary),
            summary=response.summary,
            summary_embeddings=_embeddings_client.embed([response.summary]).embeddings[
                0
            ],
            significance_score=response.significance_score,
        )

    with ThreadPoolExecutor(max_workers=10) as executor:
        return list(executor.map(process, articles))


if __name__ == "__main__":
    from openfeed.db.client import client
    from openfeed.db.global_articles import get_global_articles

    db = client()
    articles = get_global_articles(db)
    _classify_and_insert_topics(articles)
