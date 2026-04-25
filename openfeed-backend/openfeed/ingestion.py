import logging
import feedparser

from openfeed.models import Article

logger = logging.getLogger(__name__)


def get_articles(url: str, top_n: int = 50) -> list[Article]:
    d = feedparser.parse(url).entries[:top_n] or []
    articles = []
    for article in d:
        try:
            articles.append(Article.model_validate(article))
        except Exception as e:
            # TODO: We should get an alert if a feed is broken.
            logger.warning("Failed to parse article: %s\n%s", e, article)
    return articles
