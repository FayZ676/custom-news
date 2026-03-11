import json
from pathlib import Path

from app.models.feed_article import Feed, FeedArticle
from app.services.ingestion import get_articles, load_feeds


def collect(feeds: list[Feed]) -> list[FeedArticle]:
    return [article for feed in feeds for article in get_articles(feed.url)]


def persist(results: list[FeedArticle], path: Path) -> None:
    data = [article.model_dump(mode="json") for article in results]
    path.write_text(json.dumps(data, indent=2))


if __name__ == "__main__":
    feeds_path = Path(__file__).parent / "articles.json"
    feeds = load_feeds()
    articles = collect(feeds)
    persist(articles, feeds_path)
