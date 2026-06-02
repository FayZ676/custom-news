"""
Fetches real articles from a curated set of feeds for use as enricher test fixtures.
Spans a range of impact: high (Reuters, NYT) → mid (TechCrunch, Wired, Quanta) → low (Daring Fireball, SO Blog, HN).
"""

import json
from pathlib import Path

from openfeed.clients.feed_parser import get_articles

FEEDS = [
    # High impact / hard news
    (
        "Reuters – Business & Finance",
        "https://ir.thomsonreuters.com/rss/news-releases.xml?items=15",
    ),
    (
        "The New York Times – Technology",
        "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    ),
    ("Ars Technica", "https://feeds.arstechnica.com/arstechnica/index"),
    # Mid-range
    ("TechCrunch", "https://techcrunch.com/feed"),
    ("Wired", "https://www.wired.com/feed/rss"),
    ("Quanta Magazine", "https://api.quantamagazine.org/feed/"),
    # Lower impact / niche
    ("Daring Fireball", "https://daringfireball.net/feeds/main"),
    ("Stack Overflow Blog", "https://stackoverflow.blog/feed/"),
    ("Hacker News", "https://news.ycombinator.com/rss"),
]

ARTICLES_PER_FEED = 5
OUTPUT_PATH = (
    Path(__file__).parent.parent
    / "tests/services/articles/fixtures/articles_enriched.jsonl"
)


def fetch_articles(feed_title: str, url: str, n: int) -> list[dict]:
    print(f"Fetching: {feed_title} ...", end=" ", flush=True)
    articles = [
        {
            "title": a.title,
            "summary": a.summary,
            "topics": [],
        }
        for a in get_articles(url, top_n=n)
        if a.summary
    ]
    print(f"{len(articles)} articles")
    return articles


def main() -> None:
    all_articles: list[dict] = []
    for feed_title, url in FEEDS:
        articles = fetch_articles(feed_title, url, ARTICLES_PER_FEED)
        all_articles.extend(articles)

    print(f"\nTotal: {len(all_articles)} articles")

    lines = [json.dumps(a, ensure_ascii=False) for a in all_articles]
    OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Written to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
