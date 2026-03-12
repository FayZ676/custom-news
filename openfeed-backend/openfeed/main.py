from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from openfeed.embedder.local import LocalEmbedder
from openfeed.models.feed_article import FeedArticle
from openfeed.scoring import rank_articles, FeedArticleRanked


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RankRequest(BaseModel):
    query: str
    articles: list[FeedArticle]


@app.post("/rank")
def rank(request: RankRequest) -> list[FeedArticleRanked]:
    return rank_articles(request.articles, request.query, LocalEmbedder())


@app.post("/embed")
def embed(strings: list[str]): ...
