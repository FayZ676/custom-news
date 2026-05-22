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
from openfeed.models import Article, ArticleMetadata, EntitiesResponse
from openfeed.feed_parser import get_articles
from openfeed.db.global_feeds import get_global_feeds
from openfeed.db.global_settings import get_global_settings
from openfeed.iptc.classifiers.classifier import classify
from openfeed.iptc.taxonomy import load_taxonomy, load_taxonomy_index
from openfeed.openai_client import openai_client
from openfeed.database_models import PublicGlobalArticles

taxonomy = load_taxonomy(Path(__file__).parent.parent / "iptc" / "taxonomy.json")
taxonomy_index = load_taxonomy_index()


logger = logging.getLogger(__name__)


def fetch_articles(db: Client):
    global_settings = get_global_settings(db)

    seen_urls = set(get_global_article_urls(db))
    feed_articles = (
        (feed.title, article)
        for feed in get_global_feeds(db)
        for article in get_articles(feed.url)
    )
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


def _classify_and_insert_topics(articles: list[PublicGlobalArticles]) -> None:
    def _process(article: PublicGlobalArticles) -> None:
        thread_db = client()
        text = "\n\n".join(filter(None, [article.title, article.summary]))
        medtop_ids = classify(text, taxonomy, taxonomy_index, openai_client)
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
        prompt = f"""Your task is to extract the key named entities, write a summary, and score the newsworthiness of this article.

Steps:
1. Extract only **proper noun** named entities central to the story — named people, organizations, products, technologies, places, or named events. Each entity must be 1–3 words. Do NOT extract descriptive phrases, categories, statistics, or generic business terms (e.g. do NOT extract "AI chip industry", "sales forecast", "8,000 job cuts" — these are descriptions, not entities). Return an empty list if no proper noun entities are present.
2. Always use the canonical short-form name for well-known entities, regardless of how the article refers to them. Use "Meta" not "Meta Platforms Inc." or "Facebook". Use "Nvidia" not "Nvidia Corp." or "NVDA". Use "Google" not "Alphabet" (unless the story is specifically about Alphabet). Use full names for people: "Elon Musk" not "Musk". Prefer the most specific entity over its parent when it IS the story — extract "GitHub Copilot" not "Microsoft".
3. Limit yourself to the 3–7 most central entities. For roundup or list-style articles (security bulletins, weekly digests, "best of" lists), extract only the subject of the roundup — not every item within it.
4. Write a 1 sentence summary focused on the specific event, development, or situation at the core of the article. Name the key entities, describe what happened or changed, and avoid filler phrases. Do NOT use meta-framing like "The article discusses" or "This piece covers". This summary should maximally distinguish the article's topic from other articles on related subjects.
5. Score the article's newsworthiness and societal importance on a scale from 0.0 to 1.0 based on:
   - **Broad impact**: Does this affect a large number of people or industries?
   - **Significance**: Is this a major development, breakthrough, or decision with lasting consequences?
   - **Novelty**: Is this genuinely new and noteworthy, not routine or recurring?
   - **Stakes**: Are there real-world consequences (security, finance, health, policy, etc.)?

   Score guide:
   - 0.8–1.0: Events with immediate, broad societal impact affecting tens of millions of people.
     Examples: major geopolitical events, widespread cyberattacks on critical infrastructure (e.g. Log4Shell, SolarWinds),
     landmark court rulings or policy decisions with sweeping effects, significant scientific breakthroughs with immediate
     real-world consequences (e.g. a new approved vaccine, a fusion energy milestone).
   - 0.5–0.8: Meaningful developments affecting a large but specific industry or user base (millions of people).
     Examples: a major product launch from a market-leading company with broad consumer impact, a CVE in widely-used
     infrastructure software (e.g. OpenSSL, Linux kernel, nginx), a significant regulatory action against a large tech company,
     a notable acquisition or merger with industry-wide consequences.
   - 0.3–0.5: Noteworthy but narrow in scope — affects a specialized or professional audience (thousands to low millions).
     Examples: a CVE in niche or mid-tier software (e.g. cPanel, a specific CMS), a meaningful open-source library release
     with clear production use, a startup funding round with genuine industry relevance, a notable research paper without
     immediate application.
   - 0.0–0.3: Low-impact, routine, or promotional content.
     Examples: vendor case studies and DevOps blog posts, hardware reviews, product deals, opinion pieces, "how-to" tutorials,
     minor software version bumps, niche ML/infra optimizations targeting a narrow specialist audience (e.g. a new attention
     kernel for a specific GPU architecture), lifestyle or productivity tips.

Article text:
{text}"""
        response = openai_client.generate_response(
            "gpt-5.4-nano", prompt, EntitiesResponse
        )
        return ArticleMetadata(
            entities=response.entities,
            summary=response.summary,
            summary_embeddings=openai_client.embed([response.summary]).embeddings[0],
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
