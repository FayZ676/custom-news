import pytest

from openfeed.ingestion import get_articles
from openfeed.database import client, get_global_feeds
from openfeed.database_models import PublicGlobalFeeds


@pytest.mark.integration
@pytest.mark.parametrize(
    "feed", get_global_feeds(client()), ids=lambda feed: feed.title
)
def test_get_articles(feed: PublicGlobalFeeds):
    assert len(get_articles(feed.url)) > 0
