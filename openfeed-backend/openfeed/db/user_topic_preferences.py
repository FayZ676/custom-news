from uuid import UUID

from openfeed.db.client import Client
from openfeed.iptc.scorer import UserPreferences


def get_user_preferences(db: Client, user_id: UUID) -> UserPreferences:
    """Fetch a user's topic preferences as a medtop_id → "liked" | "disliked" dict."""
    response = (
        db.table("user_topic_preferences")
        .select("medtop_id, preference")
        .eq("user_id", str(user_id))
        .execute()
    )
    return {row["medtop_id"]: row["preference"] for row in response.data}
