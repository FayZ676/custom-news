import os

import requests
from pydantic import BaseModel


class RerankedDocument(BaseModel):
    relevance_score: float
    index: int


def rerank(query: str, documents: list[str]):
    response = requests.post(
        "https://api.voyageai.com/v1/rerank",
        headers={
            "Authorization": f"Bearer {os.getenv('VOYAGEAI_API_KEY', '')}",
        },
        json={"query": query, "documents": documents, "model": "rerank-2.5-lite"},
        timeout=(10, 30),
    )
    data = response.json()["data"]
    return [RerankedDocument.model_validate(d) for d in data]
