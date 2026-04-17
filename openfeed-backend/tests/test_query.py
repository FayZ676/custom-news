import csv
import json
import uuid
import pytest
from datetime import datetime

from openfeed.query import query_articles
from openfeed.database_models import PublicGlobalArticles


def _parse_dt(s: str) -> datetime:
    if s.endswith("+00"):
        s = s[:-3] + "+00:00"
    return datetime.fromisoformat(s)


def _load_articles():
    articles: list[PublicGlobalArticles] = []
    with open("tests/global_articles.csv", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["created_at"] = _parse_dt(row["created_at"])
            row["published_at"] = _parse_dt(row["published_at"])
            if row.get("embeddings"):
                row["embeddings"] = json.loads(row["embeddings"])
            if row.get("title_embeddings"):
                row["title_embeddings"] = json.loads(row["title_embeddings"])
            articles.append(PublicGlobalArticles.model_validate(row))
    return articles


EXPECATIONS = {
    "Anthropic Mythos": {
        uuid.UUID("3a41dc36-f902-4b3b-a45b-45e788caf83f"),
        uuid.UUID("48f86f60-e5d6-4f3e-aac5-95837f7ec17c"),
        uuid.UUID("b279b6be-cc5a-41df-968c-d170971c8c41"),
    }
}


@pytest.mark.parametrize("query,expected_ids", list(EXPECATIONS.items()))
def test_query(query, expected_ids):
    articles = _load_articles()
    result = query_articles(query=query, articles=articles, threshold=0.45)
    results_ids = {article.id for article in result}
    print(results_ids)
    assert results_ids == expected_ids
