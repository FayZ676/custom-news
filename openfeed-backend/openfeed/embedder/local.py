from concurrent.futures import ThreadPoolExecutor

from sentence_transformers import SentenceTransformer

from openfeed.models import EmbeddingsModel
from openfeed.embedder.base import BaseEmbedder, EmbedManyResult, EmbedOneResult


class LocalEmbedder(BaseEmbedder):
    def __init__(self, model_name: EmbeddingsModel = "all-MiniLM-L6-v2") -> None:
        self.model_name: EmbeddingsModel = model_name
        self.model = SentenceTransformer(model_name)

    def embed_one(self, text: str) -> EmbedOneResult:
        embeddings = self.model.encode(text).tolist()
        return EmbedOneResult(embeddings=embeddings, model=self.model_name)
    
    def embed_many(self, texts: list[str]) -> EmbedManyResult:
        with ThreadPoolExecutor() as executor:
            results = list(executor.map(self.embed_one, texts))

        embeddings = [result.embeddings for result in results]
        return EmbedManyResult(embeddings=embeddings, model=self.model_name)
