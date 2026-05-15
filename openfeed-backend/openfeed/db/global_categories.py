from openfeed.db.client import Client
from openfeed.db.utils import paginated_query
from openfeed.database_models import PublicGlobalCategories


def get_global_categories(db: Client) -> list[PublicGlobalCategories]:
    return [
        PublicGlobalCategories.model_validate(r)
        for page in paginated_query(db, "global_categories")
        for r in page
    ]
