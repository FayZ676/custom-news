import logging
from datetime import datetime, timezone, timedelta

import pytimeparse

from openfeed.db.client import Client
from openfeed.db.global_articles import (
    insert_global_articles,
    get_global_article_urls,
    delete_global_articles,
)
from openfeed.models import Article
from openfeed.embeddings import embed_texts
from openfeed.ingestion import get_articles
from openfeed.db.global_feeds import get_global_feeds
from openfeed.db.global_settings import get_global_settings


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

    article_embeddings = embed_texts(
        [str(article) for _, article in unique_found_articles]
    )
    articles = [
        article.to_db_schema(feed_title, article_embeddings.model, embedding)
        for (feed_title, article), embedding in zip(
            unique_found_articles, article_embeddings.embeddings
        )
    ]

    logger.info("Fetched and inserted %d new articles", len(articles))

    if articles:
        insert_global_articles(db, articles)

    return articles


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
