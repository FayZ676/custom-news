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
