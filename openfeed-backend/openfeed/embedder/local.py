from sentence_transformers import SentenceTransformer

from openfeed.models import EmbeddingsModel
from openfeed.embedder.base import BaseEmbedder, EmbeddingsResult


class LocalEmbedder(BaseEmbedder):
    def __init__(self, model_name: EmbeddingsModel = "all-MiniLM-L6-v2") -> None:
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> EmbeddingsResult:
        return EmbeddingsResult(
            embeddings=self.model.encode(texts).tolist(), model=self.model_name
        )
