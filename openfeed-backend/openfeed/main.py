from fastapi import FastAPI

from app.embedder.local import LocalEmbedder
from app.models.feed_article import FeedArticle
from app.scoring import rank_articles, FeedArticleRanked


app = FastAPI()


@app.post("/rank")
def rank(query: str, articles: list[FeedArticle]) -> list[FeedArticleRanked]:
    return rank_articles(articles, query, LocalEmbedder())


@app.post("/embed")
def embed(strings: list[str]): ...
