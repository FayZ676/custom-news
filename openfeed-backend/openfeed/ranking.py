import numpy as np
from pydantic import BaseModel

from openfeed.models import Article, ArticleEmbeddings


class ArticleRanked(BaseModel):
    article: Article
    score: float


def rank_articles(
    article_embeddings: list[ArticleEmbeddings],
    query_embeddings: list[float],
) -> list[ArticleRanked]:

    text_array = np.array([a.embeddings for a in article_embeddings])
    query_array = np.array(query_embeddings)

    # normalise so dot product == cosine similarity
    text_array /= np.linalg.norm(text_array, axis=1, keepdims=True)
    query_array /= np.linalg.norm(query_array, axis=1, keepdims=True)

    # shape: (num_articles,)
    scores = (text_array @ query_array.T).flatten()
    ranked = sorted(
        zip(article_embeddings, scores.tolist()), key=lambda x: x[1], reverse=True
    )
    return [
        ArticleRanked(article=article_emb.article, score=score)
        for article_emb, score in ranked
    ]
