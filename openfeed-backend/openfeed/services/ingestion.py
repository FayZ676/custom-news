import logging
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
from openfeed.models import Article
from openfeed.ingestion import get_articles
from openfeed.db.global_feeds import get_global_feeds
from openfeed.preprocess import extract_article_metadata
from openfeed.db.global_settings import get_global_settings
from openfeed.iptc.classifiers.classifier import classify
from openfeed.iptc.taxonomy import load_taxonomy, load_taxonomy_index
from openfeed.openai_client import openai_client
from openfeed.database_models import PublicGlobalArticles
from pathlib import Path

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


if __name__ == "__main__":
    from openfeed.db.client import client
    from openfeed.db.global_articles import get_global_articles

    db = client()
    articles = get_global_articles(db)
    _classify_and_insert_topics(articles)
