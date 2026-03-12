import pytest

from openfeed.ingestion import get_articles
from openfeed.models.feed_article import Feed
from openfeed.fixtures.collect_fixtures import load_feeds


@pytest.mark.integration
@pytest.mark.parametrize("feed", load_feeds(), ids=lambda feed: feed.id)
def test_get_articles(feed: Feed):
    assert len(get_articles(feed.url)) > 0
