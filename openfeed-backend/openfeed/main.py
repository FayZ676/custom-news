import logging

from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, BackgroundTasks

from openfeed.auth import verify_api_key
from openfeed.ingestion import get_articles
from openfeed.embeddings import embed_texts
from openfeed.database import (
    client,
    get_global_feeds,
    add_user_interest,
    update_user_interests,
    insert_global_articles,
    query_global_articles,
    get_global_article_urls,
    get_global_articles_by_id,
)
from openfeed.models import UpdateUserArticlesScoresRequest

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(dependencies=[Depends(verify_api_key)])
db_client = client()


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


@app.post("/global/articles", status_code=202)
def global_articles_update(background_tasks: BackgroundTasks):
    logger.info("POST /global/articles - accepted, processing in background")
    background_tasks.add_task(_fetch_articles)
    return Response(status_code=202)


@app.post("/global/articles/search")
def global_articles_search(query: str):
    logger.info("POST /global/articles/search - searching articles")
    query_embeddings = embed_texts([query]).embeddings[0]
    query_results = query_global_articles(db_client, query_embeddings)
    return get_global_articles_by_id(db_client, {r.article_id for r in query_results})


@app.post("/user/interest")
def user_interest_add(request: UpdateUserArticlesScoresRequest):
    logger.info(
        "POST /user/interest - adding interest for user_id=%s, interest_id=%s",
        request.user_id,
        request.interest_id,
    )
    add_user_interest(
        db_client, request.user_id, request.interest_id, request.interest_embeddings
    )


def _fetch_articles():
    seen_urls = set(get_global_article_urls(db_client))
    feed_articles = (
        (feed.id, article)
        for feed in get_global_feeds(db_client)
        for article in get_articles(feed.url)
    )
    unique_found_articles = []
    for feed_id, article in feed_articles:
        if article.link not in seen_urls:
            seen_urls.add(article.link)
            unique_found_articles.append((feed_id, article))

    article_embeddings = embed_texts(
        [str(article) for _, article in unique_found_articles]
    )
    articles = [
        article.to_db_schema(feed_id, article_embeddings.model, embedding)
        for (feed_id, article), embedding in zip(
            unique_found_articles, article_embeddings.embeddings
        )
    ]

    if articles:
        insert_global_articles(db_client, articles)
        update_user_interests(db_client)

    logger.info("Fetched and inserted %d new articles", len(articles))
