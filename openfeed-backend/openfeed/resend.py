import math
import requests
from pydantic import BaseModel, EmailStr

RESEND_BATCH_LIMIT = 100


class EmailInput(BaseModel):
    to: EmailStr | list[EmailStr]
    subject: str
    html_body: str


class BatchEmailResponse(BaseModel):
    data: list[str]


def send_batch_emails(
    emails: list[EmailInput], api_key: str, from_email: str
) -> BatchEmailResponse:
    payload = [
        {
            "from": from_email,
            "to": e.to if isinstance(e.to, list) else [e.to],
            "subject": e.subject,
            "html": e.html_body,
        }
        for e in emails
    ]

    response = requests.post(
        "https://api.resend.com/emails/batch",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=(10, 30),
    )

    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise requests.HTTPError(
            f"Resend API error {response.status_code}: {response.text}",
            response=response,
        ) from exc
    raw = response.json()
    return BatchEmailResponse(data=[item["id"] for item in raw["data"]])
