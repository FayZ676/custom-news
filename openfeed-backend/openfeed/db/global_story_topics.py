from uuid import UUID

from openfeed.db.client import Client


def insert_story_topics(
    db: Client,
    story_topics: dict[UUID, set[str]],
) -> None:
    """Insert aggregated IPTC topics for multiple stories into global_story_topics.

    Args:
        story_topics: mapping of story_id → set of medtop_ids
    """
    rows = [
        {"story_id": str(story_id), "medtop_id": medtop_id}
        for story_id, medtop_ids in story_topics.items()
        for medtop_id in medtop_ids
    ]
    if rows:
        db.table("global_story_topics").insert(rows).execute()


def get_active_medtop_ids(db: Client) -> set[str]:
    """Return all distinct medtop_ids currently present in global_story_topics."""
    response = db.table("global_story_topics").select("medtop_id").execute()
    return {row["medtop_id"] for row in response.data}
