import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta

import pytimeparse

from openfeed.db.client import Client
from openfeed.db.queries.global_articles import (
    insert_global_articles,
    get_global_article_urls,
    delete_global_articles,
)
from openfeed.db.queries.global_article_metadata_options import (
    get_global_article_metadata_options,
)
from openfeed.models import Article
from openfeed.clients.feed_parser import get_articles
from openfeed.db.queries.global_feeds import get_global_feeds
from openfeed.db.queries.global_settings import get_global_settings
from openfeed.db.models import PublicGlobalArticles
from openfeed.services.articles.enricher import ArticleEnricher

logger = logging.getLogger(__name__)

enricher = ArticleEnricher()


def fetch_articles(db: Client):
    global_settings = get_global_settings(db)
    article_metadata_options = get_global_article_metadata_options(db)
    seen_urls = set(get_global_article_urls(db))
    feed_articles = _fetch_feed_articles(get_global_feeds(db))
    unique_found_articles: list[tuple[str, Article]] = []
    cutoff = datetime.now(timezone.utc) - _parse_ttl(global_settings.article_ttl)
    for feed_title, article in feed_articles:
        if article.link not in seen_urls and article.published >= cutoff:
            seen_urls.add(article.link)
            unique_found_articles.append((feed_title, article))

    article_metadata = enricher.enrich_articles(
        [str(article) for _, article in unique_found_articles],
        article_metadata_options,
    )
    articles: list[PublicGlobalArticles] = [
        article.to_db_schema(feed_title, metadata)
        for (feed_title, article), metadata in zip(
            unique_found_articles, article_metadata
        )
    ]

    if articles:
        insert_global_articles(db, articles)

    logger.info("Fetched and inserted %d new articles", len(articles))

    return articles


def _fetch_feed_articles(feeds) -> list[tuple[str, Article]]:
    def _fetch_feed(feed) -> list[tuple[str, Article]]:
        return [(feed.title, article) for article in get_articles(feed.url)]

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(_fetch_feed, feeds)

    return [pair for feed_result in results for pair in feed_result]


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
