from dataclasses import dataclass
from uuid import UUID

from openfeed.db.client import Client
from openfeed.db.utils import decode_embeddings, paginated_query
from openfeed.db.models import PublicGlobalStories


@dataclass(frozen=True)
class StoryWithTopics:
    story: PublicGlobalStories
    topic_ids: list[str]
    topic_names: list[str]


def insert_stories(db: Client, stories: list[PublicGlobalStories]):
    db.table("global_stories").insert(
        [s.model_dump(mode="json") for s in stories]
    ).execute()


def get_stories(db: Client) -> list[PublicGlobalStories]:
    return [
        PublicGlobalStories.model_validate(r)
        for page in paginated_query(db, "global_stories", transform=decode_embeddings)
        for r in page
    ]


def delete_all_stories(db: Client):
    db.table("global_stories").delete().neq(
        "id", "00000000-0000-0000-0000-000000000000"
    ).execute()


def get_stories_with_topics(
    db: Client, excluded_story_ids: set[UUID] | None = None
) -> list[StoryWithTopics]:
    """Fetch all current stories with their aggregated IPTC topic ids.

    Args:
        excluded_story_ids: optional set of story UUIDs to exclude (e.g. hidden stories).
    """
    response = (
        db.table("global_stories")
        .select("*, global_story_topics(medtop_id, medtop_name)")
        .execute()
    )
    excluded = excluded_story_ids or set()
    result = []
    for row in response.data:
        decode_embeddings(row)
        story_id = UUID(row["id"])
        if story_id in excluded:
            continue
        raw_topics = row.get("global_story_topics") or []
        topic_ids = [t["medtop_id"] for t in raw_topics]
        topic_names = [t["medtop_name"] for t in raw_topics]
        story = PublicGlobalStories.model_validate(row)
        result.append(
            StoryWithTopics(story=story, topic_ids=topic_ids, topic_names=topic_names)
        )
    return result
