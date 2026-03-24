import pytest

from openfeed.models import Feed
from openfeed.ingestion import get_articles


# TODO: Fetch feeds from supabase
def load_feeds():
    return []


@pytest.mark.integration
@pytest.mark.parametrize("feed", load_feeds(), ids=lambda feed: feed.id)
def test_get_articles(feed: Feed):
    assert len(get_articles(feed.url)) > 0
