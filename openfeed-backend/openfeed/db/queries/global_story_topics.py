from uuid import UUID

from openfeed.db.client import Client


def insert_story_topics(
    db: Client,
    story_topics: dict[UUID, set[tuple[str, str]]],
) -> None:
    """Insert aggregated topics for multiple stories into global_story_topics.

    Args:
        story_topics: mapping of story_id -> set of (topic_id, topic_name) pairs
    """
    rows = [
        {"story_id": str(story_id), "topic_id": topic_id, "topic_name": topic_name}
        for story_id, topics in story_topics.items()
        for topic_id, topic_name in topics
    ]
    if rows:
        db.table("global_story_topics").insert(rows).execute()
