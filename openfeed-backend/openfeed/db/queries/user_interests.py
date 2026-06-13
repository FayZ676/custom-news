import uuid

from openfeed.db.client import Client
from openfeed.db.models import PublicUserInterests
from openfeed.db.utils import paginated_query


def get_all_user_interests(db: Client) -> list[PublicUserInterests]:
    return [
        PublicUserInterests.model_validate({**r, "embedding": None})
        for page in paginated_query(
            db, "user_interests", select="id, user_id, interest_text, created_at"
        )
        for r in page
    ]


def get_user_interests(db: Client, user_id: uuid.UUID) -> list[PublicUserInterests]:
    return [
        PublicUserInterests.model_validate({**r, "embedding": None})
        for page in paginated_query(
            db,
            "user_interests",
            select="id, user_id, interest_text, created_at",
            filters={"user_id": str(user_id)},
        )
        for r in page
    ]
