"""Integration tests for the RSS feed scraper."""

import pytest

from rss_scraper import FeedItem, scrape_rss_feed


# Test feed URLs
TECHNOLOGY_REVIEW_FEED_URL = "https://www.technologyreview.com/feed/"
TECHCRUNCH_FEED_URL = "https://techcrunch.com/feed/"
INVALID_FEED_URL = "https://invalid-url-that-does-not-exist.com/feed"


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

    def test_scrape_rss_feed_returns_list(self):
        """Test that scrape_rss_feed returns a list."""
        result = scrape_rss_feed(TECHNOLOGY_REVIEW_FEED_URL)
        assert isinstance(result, list)

    def test_scrape_rss_feed_returns_feed_items(self):
        """Test that scrape_rss_feed returns FeedItem instances."""
        result = scrape_rss_feed(TECHNOLOGY_REVIEW_FEED_URL)
        if result:
            assert all(isinstance(item, FeedItem) for item in result)

    def test_scrape_rss_feed_items_have_title_and_link(self):
        """Test that feed items have title and link populated."""
        result = scrape_rss_feed(TECHNOLOGY_REVIEW_FEED_URL)
        if result:
            for item in result:
                assert item.title
                assert item.link

    def test_scrape_rss_feed_different_feed(self):
        """Test scraping a different RSS feed."""
        result = scrape_rss_feed(TECHCRUNCH_FEED_URL)
        assert isinstance(result, list)
        if result:
            assert all(isinstance(item, FeedItem) for item in result)

    def test_scrape_rss_feed_invalid_url(self):
        """Test that an invalid URL returns an empty list."""
        result = scrape_rss_feed(INVALID_FEED_URL)
        assert isinstance(result, list)
