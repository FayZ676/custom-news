import os

import requests
from pydantic import BaseModel


class OpenAIEmbeddingData(BaseModel):
    object: str
    index: int
    embedding: list[float]


class OpenAIUsage(BaseModel):
    prompt_tokens: int
    total_tokens: int


class OpenAIEmbeddingResponse(BaseModel):
    object: str
    data: list[OpenAIEmbeddingData]
    model: str
    usage: OpenAIUsage


class EmbeddingsResponse(BaseModel):
    embeddings: list[list[float]]
    model: str


def embed_texts(texts: list[str]):
    api_key = os.getenv("OPENAI_API_KEY")
    res = requests.post(
        "https://api.openai.com/v1/embeddings",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "input": texts,
            "model": "text-embedding-3-small",
            "dimensions": 512,
        },
    )

    if not res.ok:
        raise Exception(f"OpenAI API error ({res.status_code}): {res.text}")

    data = OpenAIEmbeddingResponse(**res.json())
    sorted_data = sorted(data.data, key=lambda x: x.index)
    return EmbeddingsResponse(
        embeddings=[d.embedding for d in sorted_data], model=data.model
    )
