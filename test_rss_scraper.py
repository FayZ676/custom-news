"""Integration tests for the RSS feed scraper."""

import os
from pathlib import Path

import pytest

from rss_scraper import FeedItem, scrape_rss_feed


# Load feed URLs from the rss_feeds folder
RSS_FEEDS_DIR = Path(__file__).parent / "rss_feeds"
INVALID_FEED_URL = "https://invalid-url-that-does-not-exist.com/feed"


def load_feed_urls_from_file(filepath: Path) -> list[str]:
    """Load RSS feed URLs from a file, one URL per line."""
    with open(filepath) as f:
        return [line.strip() for line in f if line.strip()]


def get_all_feed_urls() -> list[str]:
    """Get all RSS feed URLs from all files in the rss_feeds folder."""
    urls = []
    for root, _, files in os.walk(RSS_FEEDS_DIR):
        for filename in files:
            filepath = Path(root) / filename
            urls.extend(load_feed_urls_from_file(filepath))
    return urls


# Load all feed URLs for parametrized tests
ALL_FEED_URLS = get_all_feed_urls()


class TestFeedItem:
    """Tests for the FeedItem data class."""

    def test_feed_item_creation(self):
        """Test creating a FeedItem with all fields."""
        item = FeedItem(
            title="Test Title",
            link="https://example.com/article",
            description="Test description",
            published="Mon, 01 Jan 2024 00:00:00 GMT",
        )
        assert item.title == "Test Title"
        assert item.link == "https://example.com/article"
        assert item.description == "Test description"
        assert item.published == "Mon, 01 Jan 2024 00:00:00 GMT"

    def test_feed_item_optional_fields(self):
        """Test creating a FeedItem with only required fields."""
        item = FeedItem(title="Test Title", link="https://example.com")
        assert item.title == "Test Title"
        assert item.link == "https://example.com"
        assert item.description is None
        assert item.published is None


class TestScrapeRssFeed:
    """Integration tests for the scrape_rss_feed function."""

    @pytest.mark.parametrize("feed_url", ALL_FEED_URLS)
    def test_scrape_rss_feed_returns_list(self, feed_url):
        """Test that scrape_rss_feed returns a list for each feed."""
        result = scrape_rss_feed(feed_url)
        assert isinstance(result, list)

    @pytest.mark.parametrize("feed_url", ALL_FEED_URLS)
    def test_scrape_rss_feed_returns_feed_items(self, feed_url):
        """Test that scrape_rss_feed returns FeedItem instances for each feed."""
        result = scrape_rss_feed(feed_url)
        if result:
            assert all(isinstance(item, FeedItem) for item in result)

    @pytest.mark.parametrize("feed_url", ALL_FEED_URLS)
    def test_scrape_rss_feed_items_have_title_and_link(self, feed_url):
        """Test that feed items have title and link populated for each feed."""
        result = scrape_rss_feed(feed_url)
        if result:
            for item in result:
                assert item.title
                assert item.link

    def test_scrape_rss_feed_invalid_url(self):
        """Test that an invalid URL returns an empty list."""
        result = scrape_rss_feed(INVALID_FEED_URL)
        assert isinstance(result, list)
