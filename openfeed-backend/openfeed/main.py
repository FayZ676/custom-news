from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from openfeed.ingestion import get_articles
from openfeed.embedder.local import LocalEmbedder
from openfeed.models.feed_article import FeedArticle
from openfeed.scoring import rank_embeddings, EmbeddingsRanked


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
    query_embeddings: list[float]
    text_embeddings: list[list[float]]


@app.post("/articles")
def articles(feeds: list[str]) -> list[FeedArticle]:
    articles = []
    for feed in feeds:
        articles.extend(get_articles(feed))
    return articles


@app.post("/rank")
def rank(request: RankRequest) -> list[EmbeddingsRanked]:
    return rank_embeddings(request.text_embeddings, request.query_embeddings)


@app.post("/embed")
def embed(texts: list[str]) -> list[list[float]]:
    return embedder.embed(texts)
