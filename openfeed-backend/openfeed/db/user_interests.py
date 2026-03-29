from pydantic import BaseModel

from openfeed.db.client import Client
from openfeed.db.utils import _decode_embeddings, _paginated_query
from openfeed.database_models import PublicUserInterests


class UserInterest(BaseModel):
    id: str
    query: str
    has_unread_articles: bool


def get_user_interests(db: Client) -> list[PublicUserInterests]:
    rows = _paginated_query(db, "user_interests", transform=_decode_embeddings)
    return [PublicUserInterests.model_validate(r) for r in rows]


def get_user_interests_for_user(db: Client, user_id: str) -> list[UserInterest]:
    rows = (
        db.table("user_interests")
        .select("id, query, user_articles(is_read)")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    return [
        UserInterest(
            id=r["id"],  # type: ignore
            query=r["query"],  # type: ignore
            has_unread_articles=any(
                not a["is_read"] for a in r.get("user_articles", [])  # type: ignore
            ),
        )
        for r in rows
    ]
