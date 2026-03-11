import json
from pathlib import Path

from app.models.feed_article import Feed, FeedArticle
from app.services.ingestion import get_articles


def collect(feeds: list[Feed]) -> list[FeedArticle]:
    return [article for feed in feeds for article in get_articles(feed.url)]


def persist(results: list[FeedArticle], path: Path) -> None:
    data = [article.model_dump(mode="json") for article in results]
    path.write_text(json.dumps(data, indent=2))


def load_feeds() -> list[Feed]:
    feeds_path = Path(__file__).parent / "feeds.json"
    with open(feeds_path) as f:
        data = json.load(f)
    return [Feed(**feed) for feed in data["feeds"]]


def load_articles() -> list[FeedArticle]:
    articles_path = Path(__file__).parent / "articles.json"
    with open(articles_path) as f:
        data = json.load(f)
    return [FeedArticle(**article) for article in data]


if __name__ == "__main__":
    feeds_path = Path(__file__).parent / "articles.json"
    feeds = load_feeds()
    articles = collect(feeds)
    persist(articles, feeds_path)
