from uuid import UUID

from openfeed.db.client import Client
from openfeed.services.stories.ranker import UserPreferences


def get_user_preferences(db: Client, user_id: UUID) -> UserPreferences:
    """Fetch a user's topic preferences as a topic_id -> "liked" | "disliked" dict."""
    response = (
        db.table("user_topic_preferences")
        .select("topic_id, preference")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {row["topic_id"]: row["preference"] for row in response.data}
