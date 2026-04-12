from openfeed.db.client import Client
from openfeed.db.utils import paginated_query
from openfeed.database_models import PublicGlobalStories


def insert_stories(db: Client, stories: list[PublicGlobalStories]):
    db.table("global_stories").insert(
        [s.model_dump(mode="json") for s in stories]
    ).execute()


def get_stories(db: Client) -> list[PublicGlobalStories]:
    return [
        PublicGlobalStories.model_validate(r)
        for page in paginated_query(db, "global_stories")
        for r in page
    ]


def delete_stories(db: Client):
    db.table("global_stories").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()
