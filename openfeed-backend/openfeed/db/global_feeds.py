from openfeed.db.client import Client
from openfeed.db.utils import paginated_query
from openfeed.database_models import PublicGlobalFeeds


def get_global_feeds(db: Client) -> list[PublicGlobalFeeds]:
    return [
        PublicGlobalFeeds.model_validate(r)
        for page in paginated_query(db, "global_feeds")
        for r in page
    ]
