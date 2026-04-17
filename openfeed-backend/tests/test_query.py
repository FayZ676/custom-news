import uuid
import pytest

from openfeed.query import query_articles

from global_articles import load_articles


EXPECATIONS = {
    "Anthropic Mythos": {
        uuid.UUID("3a41dc36-f902-4b3b-a45b-45e788caf83f"),
        uuid.UUID("48f86f60-e5d6-4f3e-aac5-95837f7ec17c"),
        uuid.UUID("b279b6be-cc5a-41df-968c-d170971c8c41"),
    }
}


@pytest.mark.parametrize("query,expected_ids", list(EXPECATIONS.items()))
def test_query(query, expected_ids):
    articles = load_articles()
    result = query_articles(query=query, articles=articles, threshold=0.45)
    results_ids = {article.id for article in result}
    print(results_ids)
    assert results_ids == expected_ids
