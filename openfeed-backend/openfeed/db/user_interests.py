from collections.abc import Iterator

from openfeed.db.client import Client
from openfeed.db.utils import decode_embeddings, paginated_query
from openfeed.database_models import PublicUserInterests


def get_user_interests(db: Client) -> Iterator[list[PublicUserInterests]]:
    for page in paginated_query(db, "user_interests", transform=decode_embeddings):
        yield [PublicUserInterests.model_validate(r) for r in page]
