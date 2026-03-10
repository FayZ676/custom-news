import json
from pathlib import Path

from app.models.feed_article import FeedArticle, Feed


def get_articles(feed: str) -> list[FeedArticle]:
    # TODO: Use feed parser to extract article content from feed.
    return []


def load_feeds() -> list[Feed]:
    feeds_path = Path(__file__).parents[3] / "app" / "feeds.json"
    with open(feeds_path) as f:
        data = json.load(f)
    return [Feed(**feed) for feed in data["feeds"]]
