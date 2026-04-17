import numpy as np

from openfeed.embeddings import embed_texts
from openfeed.database_models import PublicGlobalArticles


def query_articles(
    query: str, articles: list[PublicGlobalArticles], threshold: float
) -> list[PublicGlobalArticles]:
    """Query and rank articles by semantic similarity to the given query string."""
    query_embedding = np.array(embed_texts([query]).embeddings[0], dtype=np.float32)
    query_norm = np.linalg.norm(query_embedding)
    if query_norm > 0:
        query_embedding /= query_norm

    scored: list[tuple[float, PublicGlobalArticles]] = []
    for article in articles:
        if not article.embeddings:
            continue
        title_emb = np.array(article.embeddings, dtype=np.float32)
        similarity = _cosine_similarity(query_embedding, title_emb)
        if similarity >= threshold:
            scored.append((similarity, article))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [article for _, article in scored]


def _cosine_similarity(
    query_embedding: np.ndarray, article_embedding: np.ndarray
) -> float:
    """Compute cosine similarity between two embedding vectors."""
    article_norm = np.linalg.norm(article_embedding)
    if article_norm > 0:
        article_embedding = article_embedding / article_norm
    return float(np.dot(query_embedding, article_embedding))
