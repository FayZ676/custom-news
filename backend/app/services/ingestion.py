import json
from pathlib import Path

import feedparser

from app.models.feed_article import FeedArticle, Feed


def get_articles(url: str) -> list[FeedArticle]:
    d = feedparser.parse(url).entries or []
    articles = [FeedArticle.model_validate(article) for article in d]
    return articles


def load_feeds() -> list[Feed]:
    feeds_path = Path(__file__).parents[2] / "app" / "feeds.json"
    with open(feeds_path) as f:
        data = json.load(f)
    return [Feed(**feed) for feed in data["feeds"]]
