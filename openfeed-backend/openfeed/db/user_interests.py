from openfeed.db.client import Client
from openfeed.db.utils import _decode_embeddings, _paginated_query
from openfeed.database_models import PublicUserInterests


def get_user_interests(db: Client) -> list[PublicUserInterests]:
    rows = _paginated_query(db, "user_interests", transform=_decode_embeddings)
    return [PublicUserInterests.model_validate(r) for r in rows]
