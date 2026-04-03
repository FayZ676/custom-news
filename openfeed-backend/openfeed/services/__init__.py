"""Services layer for business logic and external integrations."""

from .ingestion import fetch_and_embed_articles, score_articles_for_interests

__all__ = [
    "fetch_and_embed_articles",
    "score_articles_for_interests",
]
