from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from openfeed.ingestion import get_articles
from openfeed.embedder.local import LocalEmbedder
from openfeed.models import Article, ArticleEmbeddings
from openfeed.ranking import rank_articles, ArticleRanked


app = FastAPI()
embedder = LocalEmbedder()


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


class RankRequest(BaseModel):
    query: str
    article_embeddings: list[ArticleEmbeddings]


@app.post("/articles")
def articles(feeds: list[str]) -> list[Article]:
    articles = []
    for feed in feeds:
        articles.extend(get_articles(feed))
    return articles


@app.post("/rank")
def rank(request: RankRequest) -> list[ArticleRanked]:
    query_embeddings = embedder.embed([request.query])[0]
    return rank_articles(request.article_embeddings, query_embeddings)


@app.post("/embed")
def embed(texts: list[str]) -> list[list[float]]:
    return embedder.embed(texts)
