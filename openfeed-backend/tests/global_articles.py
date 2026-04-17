import csv
import json
import pathlib
from datetime import datetime

from openfeed.database_models import PublicGlobalArticles

_HERE = pathlib.Path(__file__).parent


def _parse_dt(s: str) -> datetime:
    if s.endswith("+00"):
        s = s[:-3] + "+00:00"
    return datetime.fromisoformat(s)


def load_articles():
    articles: list[PublicGlobalArticles] = []
    with open(_HERE / "global_articles.csv", newline="") as f:
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
