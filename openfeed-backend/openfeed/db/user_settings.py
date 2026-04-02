from openfeed.db.client import Client
from openfeed.database_models import PublicEmailNotificationFrequency


def get_user_ids_for_frequency(
    db: Client,
    frequency: PublicEmailNotificationFrequency,
):
    return [
        str(row["user_id"])  # type: ignore
        for row in (
            db.table("user_settings")
            .select("user_id")
            .eq("email_notification", True)
            .eq("email_notification_frequency", frequency)
            .execute()
            .data
        )
    ]
