import pytest

from app.ingestion import get_articles
from app.models.feed_article import Feed
from app.fixtures.collect_fixtures import load_feeds


@pytest.mark.integration
@pytest.mark.parametrize("feed", load_feeds(), ids=lambda feed: feed.id)
def test_get_articles(feed: Feed):
    assert len(get_articles(feed.url)) > 0
