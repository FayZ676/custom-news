import logging
from datetime import datetime, timezone, timedelta

import pytimeparse

from openfeed.reranker import rerank
from openfeed.db.client import Client
from openfeed.db.global_articles import (
    insert_global_articles,
    get_global_article_urls,
    query_global_articles,
    delete_global_articles,
)
from openfeed.models import Article
from openfeed.embeddings import embed_texts
from openfeed.ingestion import get_articles
from openfeed.db.global_feeds import get_global_feeds
from openfeed.db.user_interests import get_user_interests
from openfeed.db.global_settings import get_global_settings


logger = logging.getLogger(__name__)


def fetch_and_embed_articles(db: Client):
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

    if articles:
        insert_global_articles(db, articles)
        score_articles_for_interests(db)

    logger.info("Fetched and inserted %d new articles", len(articles))


def score_articles_for_interests(db: Client):
    global_settings = get_global_settings(db)
    all_scores: list[dict] = []
    for interests_page in get_user_interests(db):
        for interest in interests_page:
            try:
                candidates = query_global_articles(
                    db,
                    interest.embeddings,
                    match_count=global_settings.max_match_count,
                    min_similarity=global_settings.min_similarity_threshold,
                )

                if not candidates:
                    continue

                reranked = rerank(interest.query, [c.document_text for c in candidates])
                all_scores.extend(
                    {
                        "user_id": str(interest.user_id),
                        "interest_id": str(interest.id),
                        "article_id": str(candidates[r.index].article_id),
                        "score": r.relevance_score,
                    }
                    for r in reranked
                )
            except (OSError, RuntimeError) as e:
                logger.exception(
                    "Failed to query/rerank articles for interest %s (user %s): %s",
                    interest.id,
                    interest.user_id,
                    e,
                )

    if all_scores:
        db.table("user_articles").upsert(
            all_scores,
            on_conflict="user_id,interest_id,article_id",
        ).execute()


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
