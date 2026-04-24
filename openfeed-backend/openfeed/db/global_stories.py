from uuid import UUID

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


def update_story(db: Client, story: PublicGlobalStories):
    db.table("global_stories").update(
        {
            "headline": story.headline,
            "summary": story.summary,
            "score": story.score,
            "score_prev": story.score_prev,
            "velocity": story.velocity,
        }
    ).eq("id", str(story.id)).execute()


def update_story_urls(db: Client, story_id: UUID, urls: list[str]):
    db.table("global_stories").update({"related_articles_urls": urls}).eq(
        "id", str(story_id)
    ).execute()


def delete_stories_by_ids(db: Client, story_ids: list[UUID]):
    db.table("global_stories").delete().in_("id", [str(i) for i in story_ids]).execute()
