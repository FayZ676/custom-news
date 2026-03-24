from abc import ABC, abstractmethod

from pydantic import BaseModel

from openfeed.models import EmbeddingsModel


class EmbeddingsResult(BaseModel):
    model: EmbeddingsModel


class EmbedManyResult(EmbeddingsResult):
    embeddings: list[list[float]]


class EmbedOneResult(EmbeddingsResult):
    embeddings: list[float]


class BaseEmbedder(ABC):

    @abstractmethod
    def embed_one(self, text: str) -> EmbedOneResult:
        """Embed a piece of text, returning a list of vectors and the model used."""
        ...

    @abstractmethod
    def embed_many(self, texts: list[str]) -> EmbedManyResult:
        ...

