import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi.responses import Response
from fastapi import FastAPI, Depends, BackgroundTasks

from openfeed.auth import verify_api_key
from openfeed.ingestion import get_articles
from openfeed.embeddings import embed_texts
from openfeed.models import Article
from openfeed.db.client import Client, client
from openfeed.db.global_articles import (
    delete_global_articles,
    insert_global_articles,
    get_global_article_urls,
)
from openfeed.db.global_feeds import get_global_feeds
from openfeed.db.user_interests import get_user_interests
from openfeed.db.user_articles import batch_insert_user_articles


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
db_client: Optional[Client] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_client
    db_client = client()
    yield


app = FastAPI(dependencies=[Depends(verify_api_key)], lifespan=lifespan)


def get_db() -> Client:
    assert db_client is not None, "db_client not initialized"
    return db_client


@app.post("/global/articles", status_code=202)
def global_articles_update(background_tasks: BackgroundTasks):
    logger.info("POST /global/articles - accepted, processing in background")
    background_tasks.add_task(_fetch_articles)
    return Response(status_code=202)


@app.delete("/global/articles", status_code=202)
def global_articles_delete():
    logger.info("DELETE /global/articles - deleting old articles")
    return delete_global_articles(get_db())


def _fetch_articles():
    seen_urls = set(get_global_article_urls(get_db()))
    feed_articles = (
        (feed.title, article)
        for feed in get_global_feeds(get_db())
        for article in get_articles(feed.url)
    )
    unique_found_articles: list[tuple[str, Article]] = []
    for feed_title, article in feed_articles:
        if article.link not in seen_urls:
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
        insert_global_articles(get_db(), articles)
        for page in get_user_interests(get_db()):
            try:
                batch_insert_user_articles(get_db(), page)
            except (OSError, RuntimeError) as e:
                logger.exception("Failed to update user interest page: %s", e)

    logger.info("Fetched and inserted %d new articles", len(articles))
