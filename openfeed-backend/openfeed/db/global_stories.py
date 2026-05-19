from dataclasses import dataclass
from uuid import UUID

from openfeed.db.client import Client
from openfeed.db.utils import paginated_query
from openfeed.database_models import PublicGlobalStories


@dataclass(frozen=True)
class StoryWithTopics:
    story: PublicGlobalStories
    topic_ids: list[str]


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


def delete_all_stories(db: Client):
    db.table("global_stories").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()


def update_story(db: Client, story: PublicGlobalStories):
    db.table("global_stories").update(
        {
            "headline": story.headline,
            "summary": story.summary,
            "score": story.score,
            "velocity": story.velocity,
        }
    ).eq("id", str(story.id)).execute()


def update_story_urls(db: Client, story_id: UUID, urls: list[str]):
    db.table("global_stories").update({"related_articles_urls": urls}).eq(
        "id", str(story_id)
    ).execute()


def delete_stories_by_ids(db: Client, story_ids: list[UUID]):
    db.table("global_stories").delete().in_("id", [str(i) for i in story_ids]).execute()


def get_stories_with_topics(
    db: Client, excluded_story_ids: set[UUID] | None = None
) -> list[StoryWithTopics]:
    """Fetch all current stories with their aggregated IPTC topic ids.

    Args:
        excluded_story_ids: optional set of story UUIDs to exclude (e.g. hidden stories).
    """
    response = (
        db.table("global_stories").select("*, global_story_topics(medtop_id)").execute()
    )
    excluded = excluded_story_ids or set()
    result = []
    for row in response.data:
        story_id = UUID(row["id"])
        if story_id in excluded:
            continue
        topic_ids = [t["medtop_id"] for t in (row.get("global_story_topics") or [])]
        story = PublicGlobalStories.model_validate(row)
        result.append(StoryWithTopics(story=story, topic_ids=topic_ids))
    return result
