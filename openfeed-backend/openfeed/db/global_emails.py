from openfeed.db.client import Client
from openfeed.database_models import PublicGlobalEmails
from openfeed.db.utils import paginated_query


def get_emails(db: Client) -> list[PublicGlobalEmails]:
    return [
        PublicGlobalEmails.model_validate(r)
        for page in paginated_query(db, "global_emails")
        for r in page
    ]


def insert_email(db: Client, email: str) -> PublicGlobalEmails:
    response = db.table("global_emails").insert({"email_text": email}).execute()
    return PublicGlobalEmails.model_validate(response.data[0])
