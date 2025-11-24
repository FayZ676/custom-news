"""RSS Feed Scraper module for extracting items from RSS feeds."""

from dataclasses import dataclass
from typing import List, Optional

import feedparser


@dataclass
class FeedItem:
    """Data class representing an item from an RSS feed."""

    title: str
    link: str
    description: Optional[str] = None
    published: Optional[str] = None


def scrape_rss_feed(url: str) -> List[FeedItem]:
    """
    Scrape an RSS feed and extract all items.

    Args:
        url: The URL of the RSS feed to scrape.

    Returns:
        A list of FeedItem instances extracted from the feed.
    """
    feed = feedparser.parse(url)
    items = []

    for entry in feed.entries:
        title = entry.get("title")
        link = entry.get("link")
        if not title or not link:
            continue
        item = FeedItem(
            title=title,
            link=link,
            description=entry.get("description") or entry.get("summary"),
            published=entry.get("published"),
        )
        items.append(item)

    return items
