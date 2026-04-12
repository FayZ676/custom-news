"""Services layer for business logic and external integrations."""

from .ingestion import fetch_articles, score_articles_for_interests

__all__ = [
    "fetch_articles",
    "score_articles_for_interests",
]
