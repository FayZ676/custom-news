import logging
from typing import Optional
from contextlib import asynccontextmanager

from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, BackgroundTasks

from openfeed.auth import verify_api_key
from openfeed.ingestion import get_articles
from openfeed.embeddings import embed_texts
from openfeed.models import (
    Article,
    UserArticlesReadRequest,
    UpdateUserArticlesScoresRequest,
)
from openfeed.db.client import Client, client
from openfeed.db.global_articles import (
    get_global_articles,
    query_global_articles,
    delete_global_articles,
    insert_global_articles,
    get_global_article_urls,
    get_global_articles_by_id,
)
from openfeed.db.user_articles import (
    read_user_articles,
    insert_user_articles,
    get_user_articles_for_interest,
)
from openfeed.db.global_feeds import get_global_feeds
from openfeed.db.user_interests import get_user_interests, get_user_interests_for_user


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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Client:
    assert db_client is not None, "db_client not initialized"
    return db_client


@app.get("/global/articles")
def global_articles_get(page_size: int, page: int):
    logger.info("POST /global/articles - retrieving articles")
    return get_global_articles(get_db(), page_size, page)


@app.post("/global/articles", status_code=202)
def global_articles_update(background_tasks: BackgroundTasks):
    logger.info("POST /global/articles - accepted, processing in background")
    background_tasks.add_task(_fetch_articles)
    return Response(status_code=202)


@app.delete("/global/articles", status_code=202)
def global_articles_delete():
    logger.info("POST /global/articles - accepted, processing in background")
    return delete_global_articles(get_db())


@app.post("/global/articles/search")
def global_articles_search(query: str):
    logger.info("POST /global/articles/search - searching articles")
    query_embeddings = embed_texts([query]).embeddings[0]
    query_results = query_global_articles(get_db(), query_embeddings)
    return get_global_articles_by_id(get_db(), {r.article_id for r in query_results})


@app.get("/user/articles")
def user_articles_get(user_id: str, interest_id: str):
    logger.info("POST /global/articles - retrieving articles")
    return get_user_articles_for_interest(get_db(), user_id, interest_id)


@app.patch("/user/articles/read")
def user_articles_read(request: UserArticlesReadRequest):
    logger.info("PATCH /user/articles/read - mark user article as read")
    return read_user_articles(get_db(), request.user_id, request.article_ids)


@app.get("/user/interests")
def user_interests_get(user_id: str):
    logger.info("POST /global/articles - retrieving interests for user")
    return get_user_interests_for_user(get_db(), user_id)


@app.post("/user/interests")
def user_interest_add(request: UpdateUserArticlesScoresRequest):
    logger.info(
        "POST /user/interest - adding interest for user_id=%s, interest_id=%s",
        request.user_id,
        request.interest_id,
    )
    insert_user_articles(
        get_db(), request.user_id, request.interest_id, request.interest_embeddings
    )


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
        user_interests = get_user_interests(get_db())
        for interest in user_interests:
            insert_user_articles(
                get_db(), interest.user_id, interest.id, interest.embeddings
            )

    logger.info("Fetched and inserted %d new articles", len(articles))
