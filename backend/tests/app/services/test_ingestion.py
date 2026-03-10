import pytest

from app.services.ingestion import get_articles, load_feeds
from app.models.feed_article import Feed


@pytest.mark.integration
@pytest.mark.parametrize("feed", load_feeds(), ids=lambda feed: feed.id)
def test_get_articles(feed: Feed):
    assert len(get_articles(feed.url)) > 0
