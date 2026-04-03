import requests
from pydantic import BaseModel

from openfeed.config import settings


class RerankedDocument(BaseModel):
    relevance_score: float
    index: int


def rerank(query: str, documents: list[str]):
    response = requests.post(
        "https://api.voyageai.com/v1/rerank",
        headers={
            "Authorization": f"Bearer {settings.voyageai_api_key}",
        },
        json={"query": query, "documents": documents, "model": "rerank-2.5-lite"},
        timeout=(10, 30),
    )
    data = response.json()["data"]
    return [RerankedDocument.model_validate(d) for d in data]
