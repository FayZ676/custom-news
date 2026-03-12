import numpy as np

from app.embedder.base import BaseEmbedder
from app.models.feed_article import FeedArticle


def rank_articles(
    articles: list[FeedArticle],
    query: str,
    embedder: BaseEmbedder,
) -> list[tuple[FeedArticle, float]]:
    if not query:
        return [(article, 0.0) for article in articles]

    text_embeddings = np.array(embedder.embed([str(a) for a in articles]))
    query_embedding = np.array(embedder.embed([query]))

    # normalise so dot product == cosine similarity
    text_embeddings /= np.linalg.norm(text_embeddings, axis=1, keepdims=True)
    query_embedding /= np.linalg.norm(query_embedding, axis=1, keepdims=True)

    # shape: (num_articles,)
    scores = (text_embeddings @ query_embedding.T).flatten()
    ranked = sorted(zip(articles, scores.tolist()), key=lambda x: x[1], reverse=True)
    return ranked
