from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from openfeed.auth import verify_api_key
from openfeed.ingestion import get_articles
from openfeed.embeddings import embed_texts
from openfeed.database import (
    client,
    insert_global_articles,
    update_user_articles_scores,
    update_all_user_articles_scores,
)
from openfeed.models import (
    ArticleEmbeddings,
    FetchArticlesRequest,
    UpdateUserArticlesScoresRequest,
)


app = FastAPI(dependencies=[Depends(verify_api_key)])
db_client = client()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/global/articles")
def fetch_articles(request: FetchArticlesRequest):
    articles_with_feed = []
    for feed_info in request.feeds:
        articles = get_articles(feed_info.url)
        articles_with_feed.extend([(feed_info.id, article) for article in articles])

    articles = [a for _, a in articles_with_feed]
    embeddings = embed_texts([str(a) for a in articles])
    articles = [
        ArticleEmbeddings(
            feed_id=feed_id,
            article=article,
            embeddings=embedding,
            embeddings_model=embeddings.model,
        )
        for (feed_id, article), embedding in zip(
            articles_with_feed, embeddings.embeddings
        )
    ]
    insert_global_articles(db_client, articles)
    update_all_user_articles_scores(db_client)


@app.post("/user/articles/scores")
def update_user_article_scores(request: UpdateUserArticlesScoresRequest):
    update_user_articles_scores(
        db_client, request.user_id, request.interest_id, request.interest_embeddings
    )
