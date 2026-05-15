from openfeed.db.client import Client
from openfeed.db.utils import paginated_query
from openfeed.database_models import PublicGlobalSubCategories


def get_sub_categories_by_category(
    db: Client, category_name: str
) -> list[PublicGlobalSubCategories]:
    return [
        PublicGlobalSubCategories.model_validate(r)
        for page in paginated_query(
            db,
            "global_sub_categories",
            filters={"category_name": category_name},
        )
        for r in page
    ]
