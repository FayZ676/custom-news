from openfeed.db.client import Client
from openfeed.db.models import PublicUserSettings


def get_all_email_notification_users(db: Client) -> list[PublicUserSettings]:
    """Return all users who have email notifications enabled, regardless of frequency."""
    return [
        PublicUserSettings.model_validate(row)
        for row in (
            db.table("user_settings")
            .select("*")
            .eq("email_notification", True)
            .execute()
            .data
        )
    ]
