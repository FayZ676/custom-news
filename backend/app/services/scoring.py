import numpy as np

from app.embedder.base import BaseEmbedder
from app.models.feed_article import FeedArticle


def rank_articles(
    articles: list[FeedArticle],
    queries: list[str],
    embedder: BaseEmbedder,
) -> list[tuple[FeedArticle, float]]:
    if not queries:
        return [(article, 0.0) for article in articles]

    text_embeddings = np.array(embedder.embed([str(a) for a in articles]))
    query_embeddings = np.array(embedder.embed(queries))

    # normalise so dot product == cosine similarity
    text_embeddings /= np.linalg.norm(text_embeddings, axis=1, keepdims=True)
    query_embeddings /= np.linalg.norm(query_embeddings, axis=1, keepdims=True)

    # shape: (num_articles, num_queries)
    similarity_matrix = text_embeddings @ query_embeddings.T

    # max score across all queries for each article
    scores = similarity_matrix.max(axis=1)

    ranked = sorted(zip(articles, scores.tolist()), key=lambda x: x[1], reverse=True)
    return ranked
