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


def set_liked_preferences(db: Client, user_id: UUID, medtop_ids: list[str]) -> None:
    """Replace all liked preferences for a user with the given medtop_ids."""
    db.table("user_topic_preferences").delete().eq("user_id", str(user_id)).eq(
        "preference", "liked"
    ).execute()
    rows = [
        {"user_id": str(user_id), "medtop_id": mid, "preference": "liked"}
        for mid in medtop_ids
    ]
    if rows:
        db.table("user_topic_preferences").insert(rows).execute()


def add_disliked_preferences(db: Client, user_id: UUID, medtop_ids: list[str]) -> None:
    """Add disliked preferences for a user, ignoring any that already exist."""
    rows = [
        {"user_id": str(user_id), "medtop_id": mid, "preference": "disliked"}
        for mid in medtop_ids
    ]
    if rows:
        db.table("user_topic_preferences").upsert(rows).execute()
