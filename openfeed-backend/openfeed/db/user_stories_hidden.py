from uuid import UUID

from openfeed.db.client import Client


def insert_hidden_story(db: Client, user_id: UUID, story_id: UUID) -> None:
    """Record that a user has hidden a story."""
    db.table("user_stories_hidden").insert(
        {"user_id": str(user_id), "story_id": str(story_id)}
    ).execute()


def get_hidden_story_ids(db: Client, user_id: UUID) -> set[UUID]:
    """Return the set of story_ids hidden by a user."""
    response = (
        db.table("user_stories_hidden")
        .select("story_id")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {UUID(row["story_id"]) for row in response.data}
