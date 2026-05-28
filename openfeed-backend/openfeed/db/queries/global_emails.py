from openfeed.db.client import Client
from openfeed.db.models import PublicGlobalEmails


def get_latest_email(db: Client) -> PublicGlobalEmails | None:
    response = (
        db.table("global_emails")
        .select("*")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return (
        PublicGlobalEmails.model_validate(response.data[0]) if response.data else None
    )


def insert_email(db: Client, email: str) -> PublicGlobalEmails:
    response = db.table("global_emails").insert({"email_text": email}).execute()
    return PublicGlobalEmails.model_validate(response.data[0])
