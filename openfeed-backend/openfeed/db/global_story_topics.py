from uuid import UUID

from openfeed.db.client import Client


def insert_story_topics(
    db: Client,
    story_topics: dict[UUID, set[tuple[str, str]]],
) -> None:
    """Insert aggregated IPTC topics for multiple stories into global_story_topics.

    Args:
        story_topics: mapping of story_id → set of (medtop_id, medtop_name) pairs
    """
    rows = [
        {"story_id": str(story_id), "medtop_id": medtop_id, "medtop_name": medtop_name}
        for story_id, topics in story_topics.items()
        for medtop_id, medtop_name in topics
    ]
    if rows:
        db.table("global_story_topics").insert(rows).execute()
