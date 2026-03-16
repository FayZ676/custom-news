from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from openfeed.ingestion import get_articles
from openfeed.models import ArticleEmbeddings, EmbedRequest
from openfeed.embedder.local import LocalEmbedder, EmbedOneResult


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


@app.post("/fetch_articles")
def fetch_articles(feeds: list[str]) -> list[ArticleEmbeddings]:
    articles = [article for feed in feeds for article in get_articles(feed)]
    embeddings = embedder.embed_many([str(a) for a in articles])
    return [
        ArticleEmbeddings(
            article=a,
            embeddings=e,
            embeddings_model=embeddings.model
        ) for a, e in zip(articles, embeddings.embeddings)
    ]


@app.post("/embed")
def embed(request: EmbedRequest) -> EmbedOneResult:
    return embedder.embed_one(request.text)
