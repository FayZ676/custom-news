from abc import ABC, abstractmethod


class BaseEmbedder(ABC):

    @abstractmethod
    def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of texts, returning a list of vectors."""
        ...
