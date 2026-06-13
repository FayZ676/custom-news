import logging
import uuid
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from openfeed.db.client import Client
from openfeed.db.models import PublicUserArticles, PublicUserInterests
from openfeed.db.queries.global_article_metadata_options import (
    get_global_article_metadata_options,
    GlobalArticleMetadataOption,
)
from openfeed.db.queries.user_articles import get_user_articles, replace_user_articles
from openfeed.db.queries.user_interests import get_all_user_interests
from openfeed.clients.newsdata import NewsDataArticle, get_latest_articles
from openfeed.services.articles.enricher import ArticleEnricher, ArticleMetadata

logger = logging.getLogger(__name__)

enricher = ArticleEnricher()


def refresh_user_articles(db: Client):
    """Run every user's interest queries against NewsData.io and replace each
    user's articles with the results."""
    metadata_options = get_global_article_metadata_options(db)
    interests_by_user: dict[uuid.UUID, list[PublicUserInterests]] = defaultdict(list)
    for interest in get_all_user_interests(db):
        interests_by_user[interest.user_id].append(interest)

    for user_id, interests in interests_by_user.items():
        try:
            _refresh_articles_for_user(db, user_id, interests, metadata_options)
        except Exception:
            logger.exception("Failed to refresh articles for user %s", user_id)

    logger.info("Refreshed articles for %d users", len(interests_by_user))


def _refresh_articles_for_user(
    db: Client,
    user_id: uuid.UUID,
    interests: list[PublicUserInterests],
    metadata_options: dict[str, list[GlobalArticleMetadataOption]],
):
    found = _query_articles(interests)

    # Hourly queries mostly return the same articles; carry existing rows over
    # (keeping their id, enrichment, and embedding) and only enrich new URLs.
    existing_by_url = {a.url: a for a in get_user_articles(db, user_id)}
    carried_over = [existing_by_url[url] for url in found if url in existing_by_url]
    new_articles = [a for url, a in found.items() if url not in existing_by_url]

    article_texts = [str(a) for a in new_articles]
    article_metadata = enricher.enrich_articles(article_texts, metadata_options)
    article_embeddings = enricher.embed_articles(article_texts)

    articles = carried_over + [
        _to_db_schema(user_id, article, metadata, embedding)
        for article, metadata, embedding in zip(
            new_articles, article_metadata, article_embeddings
        )
    ]
    replace_user_articles(db, user_id, articles)
    logger.info(
        "Refreshed %d articles (%d new) for user %s",
        len(articles),
        len(new_articles),
        user_id,
    )


def _query_articles(
    interests: list[PublicUserInterests],
) -> dict[str, NewsDataArticle]:
    """Run each interest as a NewsData query, deduplicated by article URL."""
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = executor.map(
            lambda interest: get_latest_articles(interest.interest_text), interests
        )
    found: dict[str, NewsDataArticle] = {}
    for articles in results:
        for article in articles:
            found.setdefault(article.link, article)
    return found


def _to_db_schema(
    user_id: uuid.UUID,
    article: NewsDataArticle,
    metadata: ArticleMetadata,
    embedding: list[float] | None,
) -> PublicUserArticles:
    return PublicUserArticles(
        id=uuid.uuid4(),
        user_id=user_id,
        source_name=article.source_name,
        title=article.title,
        url=article.link,
        summary=article.description,
        image_url=article.image_url,
        published_at=article.published,
        created_at=datetime.now(timezone.utc),
        topic=metadata.topic,
        type=metadata.type,
        coverage=metadata.coverage,
        duration=metadata.duration,
        impact=metadata.impact,
        embedding=embedding,
        search_vector=None,
    )
