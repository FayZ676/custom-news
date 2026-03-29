from openfeed.db.client import Client
from openfeed.db.utils import _paginated_query
from openfeed.database_models import PublicGlobalFeeds


def get_global_feeds(db: Client) -> list[PublicGlobalFeeds]:
    rows = _paginated_query(db, "global_feeds")
    return [PublicGlobalFeeds.model_validate(r) for r in rows]
