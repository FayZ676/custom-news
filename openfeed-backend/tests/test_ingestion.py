from unittest.mock import patch, MagicMock

import pytest

from openfeed.ingestion import get_articles


def _make_feed(entries):
    feed = MagicMock()
    feed.entries = entries
    return feed


def test_get_articles_logs_warning_when_feed_is_empty(caplog):
    with patch("openfeed.ingestion.feedparser.parse", return_value=_make_feed([])):
        with caplog.at_level("WARNING", logger="openfeed.ingestion"):
            result = get_articles("https://example.com/empty.rss")

    assert result == []
    assert any(
        record.message == "Feed returned no articles: https://example.com/empty.rss"
        for record in caplog.records
    )


def test_get_articles_no_warning_when_feed_has_articles(caplog):
    entry = MagicMock()
    entry.title = "Test Article"
    entry.link = "https://example.com/article"
    entry.published_parsed = (2024, 1, 1, 0, 0, 0, 0, 1, 0)

    from openfeed.models import Article

    with patch("openfeed.ingestion.feedparser.parse", return_value=_make_feed([entry])):
        with patch.object(Article, "model_validate", return_value=MagicMock(spec=Article)):
            with caplog.at_level("WARNING", logger="openfeed.ingestion"):
                result = get_articles("https://example.com/feed.rss")

    assert len(result) == 1
    assert not any("Feed returned no articles" in record.message for record in caplog.records)
