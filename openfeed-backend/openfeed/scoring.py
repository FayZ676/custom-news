import numpy as np
from pydantic import BaseModel


class EmbeddingsRanked(BaseModel):
    embeddings: list[list[float]]
    score: float


def rank_embeddings(
    text_embeddings: list[list[float]],
    query_embeddings: list[float],
) -> list[EmbeddingsRanked]:
    text_array = np.array(text_embeddings)
    query_array = np.array(query_embeddings)

    # normalise so dot product == cosine similarity
    text_array /= np.linalg.norm(text_array, axis=1, keepdims=True)
    query_array /= np.linalg.norm(query_array, axis=1, keepdims=True)

    # shape: (num_articles,)
    scores = (text_array @ query_array.T).flatten()
    ranked = sorted(zip(text_array, scores.tolist()), key=lambda x: x[1], reverse=True)
    return [
        EmbeddingsRanked(embeddings=embeddings, score=score)
        for embeddings, score in ranked
    ]
