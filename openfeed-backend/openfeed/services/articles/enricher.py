import logging

from openfeed.clients.openai_client import OpenAIClient


logger = logging.getLogger(__name__)


class ArticleEnricher:
    def __init__(self) -> None:
        self._embedding_client = OpenAIClient(
            model="gpt-5.4-mini",
        )

    def embed_articles(self, articles: list[str]) -> list[list[float]]:
        if not articles:
            return []
        return self._embedding_client.embed(articles).embeddings
