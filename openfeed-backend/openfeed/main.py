from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from openfeed.ingestion import get_articles
from openfeed.embedder.local import LocalEmbedder, EmbedOneResult
from openfeed.models import ArticleEmbeddings, EmbedRequest, FetchArticlesRequest


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
def fetch_articles(request: FetchArticlesRequest) -> list[ArticleEmbeddings]:
    articles_with_feed = []
    for feed_info in request.feeds:
        articles = get_articles(feed_info.url)
        articles_with_feed.extend([(feed_info.id, article) for article in articles])
    
    articles = [a for _, a in articles_with_feed]
    embeddings = embedder.embed_many([str(a) for a in articles])
    
    return [
        ArticleEmbeddings(
            feed_id=feed_id,
            article=article,
            embeddings=embedding,
            embeddings_model=embeddings.model
        ) for (feed_id, article), embedding in zip(articles_with_feed, embeddings.embeddings)
    ]


@app.post("/embed")
def embed(request: EmbedRequest) -> EmbedOneResult:
    return embedder.embed_one(request.text)
