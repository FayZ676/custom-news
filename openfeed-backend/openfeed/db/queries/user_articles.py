import json
import uuid

from openfeed.db.client import Client
from openfeed.db.models import PublicUserArticles
from openfeed.db.utils import paginated_query


def _parse_embedding(row: dict) -> None:
    # pgvector columns arrive as their text representation over PostgREST.
    if isinstance(row.get("embedding"), str):
        row["embedding"] = json.loads(row["embedding"])


def get_user_articles(db: Client, user_id: uuid.UUID) -> list[PublicUserArticles]:
    return [
        PublicUserArticles.model_validate(r)
        for page in paginated_query(
            db,
            "user_articles",
            filters={"user_id": str(user_id)},
            transform=_parse_embedding,
        )
        for r in page
    ]


def replace_user_articles(
    db: Client, user_id: uuid.UUID, articles: list[PublicUserArticles]
):
    db.table("user_articles").delete().eq("user_id", str(user_id)).execute()
    if articles:
        # search_vector is a generated column; Postgres rejects explicit values.
        db.table("user_articles").insert(
            [a.model_dump(mode="json", exclude={"search_vector"}) for a in articles]
        ).execute()
