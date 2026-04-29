import requests
from pydantic import BaseModel, EmailStr

RESEND_BATCH_LIMIT = 100
DIGEST_TEMPLATE_ALIAS = "thelatesttimes-digest"


class TemplateEmailInput(BaseModel):
    to: EmailStr | list[EmailStr]
    template_id: str  # published template ID or alias
    variables: dict[str, str | int] = {}


class BatchEmailResponse(BaseModel):
    data: list[str]


class CreateTemplateResponse(BaseModel):
    id: str


def send_batch_template_emails(
    emails: list[TemplateEmailInput], api_key: str, from_email: str
) -> BatchEmailResponse:
    payload = [
        {
            "from": from_email,
            "to": e.to if isinstance(e.to, list) else [e.to],
            "template": {
                "id": e.template_id,
                **({"variables": e.variables} if e.variables else {}),
            },
        }
        for e in emails
    ]

    response = requests.post(
        "https://api.resend.com/emails/batch",
        headers=_resend_headers(api_key),
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


def create_template_digest(api_key: str) -> CreateTemplateResponse:
    return _create_and_publish_template(
        name="The Latest Times - Digest",
        alias=DIGEST_TEMPLATE_ALIAS,
        subject="Your Latest Times digest",
        html=_DIGEST_TEMPLATE_HTML,
        variables=[
            {"key": "TOP_STORIES_SUMMARY", "type": "string"},
            {"key": "INTERESTS_SUMMARY", "type": "string"},
            {"key": "FEED_URL", "type": "string"},
        ],
        api_key=api_key,
    )


def _create_and_publish_template(
    name: str,
    alias: str,
    subject: str,
    html: str,
    variables: list[dict],
    api_key: str,
) -> CreateTemplateResponse:
    payload = {
        "name": name,
        "alias": alias,
        "subject": subject,
        "html": html,
        "variables": variables,
    }
    response = requests.post(
        "https://api.resend.com/templates",
        headers=_resend_headers(api_key),
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

    template_id: str = response.json()["id"]

    pub_response = requests.post(
        f"https://api.resend.com/templates/{template_id}/publish",
        headers=_resend_headers(api_key),
        timeout=(10, 30),
    )
    try:
        pub_response.raise_for_status()
    except requests.HTTPError as exc:
        raise requests.HTTPError(
            f"Resend publish error {pub_response.status_code}: {pub_response.text}",
            response=pub_response,
        ) from exc

    return CreateTemplateResponse(id=template_id)


def _resend_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


_DIGEST_TEMPLATE_HTML = """\
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
    <link
      rel="preload"
      as="image"
      href="https://uopbwbyktgayhpbvvgvs.supabase.co/storage/v1/object/public/assets/logo.svg"
    />
    <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap');

      :root { color-scheme: light only; }

      body {
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }

      .wrapper {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        font-family: 'Lora', Georgia, serif;
      }

      .header {
        padding: 28px 32px 20px;
        border-bottom: 1px solid #f0f0f0;
        text-align: center;
      }

      .header img {
        display: block;
        margin: 0 auto;
        height: 28px;
        width: auto;
        border: 0;
        outline: none;
      }

      .section {
        padding: 28px 32px 0;
        border-top: 1px solid #f0f0f0;
      }

      .section-label {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .section-body {
        padding: 12px 32px 16px;
      }

      .section-body p {
        margin: 0;
      }

      .feed-link-row {
        padding: 0 32px 24px;
        font-size: 13px;
        color: #555;
      }

      .feed-link {
        color: #1a1a1a;
        font-weight: 600;
        text-decoration: underline;
      }

      .cta-row {
        padding: 8px 32px 32px;
        text-align: center;
      }

      .cta-button {
        display: inline-block;
        background-color: #1a1a1a;
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        padding: 12px 28px;
        border-radius: 6px;
        letter-spacing: 0.01em;
        text-decoration: none;
        font-family: 'Lora', Georgia, serif;
      }

      .footer {
        padding: 16px 32px 28px;
        border-top: 1px solid #f0f0f0;
        font-size: 11px;
        color: #bbb;
        text-align: center;
      }

      .footer a {
        color: #bbb;
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
      Discover the latest news and trending stories today.
    </div>
    <div class="wrapper">
      <div class="header">
        <img
          alt="The Latest Times"
          src="https://uopbwbyktgayhpbvvgvs.supabase.co/storage/v1/object/public/assets/logo.svg"
          height="28"
          width="auto"
        />
      </div>

      <div class="section">
        <p class="section-label">Trending </p>
      </div>
      <div class="section-body">
        <p>{{{TOP_STORIES_SUMMARY}}}</p>
      </div>
      <div class="feed-link-row">
        Explore the full feed at
        <a href="{{{FEED_URL}}}" class="feed-link" rel="noopener noreferrer nofollow" target="_blank"
          >The Latest Times</a
        >
      </div>

      <div class="section">
        <p class="section-label">My News</p>
      </div>
      <div class="section-body">
        <p>{{{INTERESTS_SUMMARY}}}</p>
      </div>

      <div class="cta-row">
        <a href="{{{FEED_URL}}}" class="cta-button" rel="noopener noreferrer nofollow" target="_blank"
          >Go to The Latest Times →</a
        >
      </div>

      <div class="footer">
        Sent by The Latest Times —
        <a href="{{{FEED_URL}}}" rel="noopener noreferrer nofollow" target="_blank"
          >To unsubscribe, visit your dashboard settings</a
        >
      </div>
    </div>
  </body>
</html>
"""


if __name__ == "__main__":
    from openfeed.config import settings

    create_template_digest(settings.resend_api_key)
