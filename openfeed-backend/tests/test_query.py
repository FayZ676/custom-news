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
        uuid.UUID("2112583c-cdb3-4b8a-8be5-ff9895c3a025"),
        uuid.UUID("48f86f60-e5d6-4f3e-aac5-95837f7ec17c"),
        uuid.UUID("48676fbd-f698-47c7-81ba-43debecc2cb5"),
        uuid.UUID("bbacf405-b70b-4d7b-91eb-c7fcafd539f8"),
        uuid.UUID("1d09eeba-a521-4e54-b6e8-4892ffc5865a"),
        uuid.UUID("914d0935-c236-42ad-8d93-2505024d62f6"),
        uuid.UUID("87a83ff1-3d46-4bb4-bf56-d7adae62673c"),
        uuid.UUID("24c5c615-3d09-48be-b2b4-e792ed79660c"),
        uuid.UUID("b3b61d5f-ec5e-405f-b74a-84a2cc042c66"),
        uuid.UUID("f72839c3-811e-4b20-ba0b-48fa1e24f4cd"),
        uuid.UUID("521eb986-2974-47e4-8df3-01fd329e1e5b"),
        uuid.UUID("52c9abca-d1b8-40f3-b309-2e66a8975963"),
        uuid.UUID("909e98c8-e22c-4f0b-92c1-c40a21f94f1a"),
        uuid.UUID("85623f9a-42ee-44f9-afe7-c0217ed2e234"),
        uuid.UUID("278acde5-a4a1-49de-b3ef-ef707ea437a7"),
        uuid.UUID("1bc29edb-a219-491a-9035-0335ebd337cc"),
        uuid.UUID("3a41dc36-f902-4b3b-a45b-45e788caf83f"),
        uuid.UUID("16125283-d5c2-472f-81b0-8c88eda4b8a9"),
        uuid.UUID("86221d68-e615-44d2-9a8c-022fada42df4"),
        uuid.UUID("2f26258f-efe6-4f03-95da-552388719506"),
        uuid.UUID("7397048c-c944-47ba-a220-b1e57aba673e"),
        uuid.UUID("1d82dbd1-ef62-43fc-ac28-3abe490574c7"),
        uuid.UUID("b5636780-f31e-4164-ac22-340bd3df7466"),
        uuid.UUID("8d1f68e7-eb72-4837-91e7-976d12d51a5d"),
        uuid.UUID("73446f20-0166-4e9d-9171-55edcbc728b6"),
        uuid.UUID("2a5ada67-509e-444e-8772-518a9a06faca"),
        uuid.UUID("4b379e0a-281c-4c06-9923-3e4f6f22a103"),
        uuid.UUID("01d0fe1b-a1dc-47fa-9686-33a32d98b776"),
        uuid.UUID("dcbea1da-770d-40f3-9bcf-ec98563df9f8"),
        uuid.UUID("b7bfc9d0-3920-4a30-a0c1-9cf987dd2d1c"),
        uuid.UUID("14ac7120-a6db-47e1-aa4a-7f4923f5ffbe"),
        uuid.UUID("1d777fe0-122a-40bb-beca-e52b14b2b76f"),
        uuid.UUID("9d054149-ce56-489b-991f-482ae9bc6750"),
        uuid.UUID("2aad8435-4ab3-4ba2-bd81-652c868de239"),
        uuid.UUID("e92849a2-0e2d-4c33-b3f4-43866230db0b"),
        uuid.UUID("a89d35f9-880b-4046-9e0a-d5a10372bb86"),
        uuid.UUID("1afefc56-f68e-40b0-8a6b-37a3fcd3c8db"),
        uuid.UUID("6574e6ff-ffc8-40ec-93e0-f15507fbc868"),
        uuid.UUID("6bff77be-a323-4695-a8f1-3fd8396d2c21"),
        uuid.UUID("b279b6be-cc5a-41df-968c-d170971c8c41"),
        uuid.UUID("573c73c9-4eb9-451f-bfed-d43a51dc345a"),
        uuid.UUID("bc92f0c0-409f-40f6-8172-4033102e6f93"),
        uuid.UUID("d9e7d0f3-e95a-455c-a511-ce5640213d5c"),
        uuid.UUID("e502dc7b-2920-4f84-bb41-ea96f494b89c"),
        uuid.UUID("f46ccc9d-c270-4960-a5d4-8161a60b9bba"),
    }
}


@pytest.mark.parametrize("query,expected_ids", list(EXPECATIONS.items()))
def test_query(query, expected_ids):
    articles = _load_articles()
    result = query_articles(query=query, articles=articles, threshold=0.3)
    results_ids = {article.id for article in result}
    print(results_ids)
    assert results_ids == expected_ids
