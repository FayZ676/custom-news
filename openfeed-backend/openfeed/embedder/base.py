from abc import ABC, abstractmethod

from pydantic import BaseModel


class EmbeddingsResult(BaseModel):
    embeddings: list[list[float]]
    model: str


class BaseEmbedder(ABC):

    @abstractmethod
    def embed(self, texts: list[str]) -> EmbeddingsResult:
        """Embed a list of texts, returning a list of vectors."""
        ...
