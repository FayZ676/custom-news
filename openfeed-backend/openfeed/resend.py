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
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Your Latest Times digest</title>
    <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap');
        :root { color-scheme: light only; }
        body,
        body > table,
        body > table > tbody > tr > td { background-color: #f5f5f5 !important; }
        .email-wrapper { background-color: #ffffff !important; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Lora', Georgia, serif;">
  <table width="600" cellpadding="0" cellspacing="0" border="0"
    class="email-wrapper"
    style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f0f0f0;">
              <img src="https://uopbwbyktgayhpbvvgvs.supabase.co/storage/v1/object/public/assets/logo.svg"
                   alt="The Latest Times"
                   height="28"
                   style="display: block; height: 28px; width: auto; border: 0;" />
            </td>
          </tr>

          <!-- Top stories summary -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                {{{TOP_STORIES_SUMMARY}}}
              </table>
            </td>
          </tr>

          <!-- Top stories CTA -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
                <p style="margin: 0; font-size: 13px; color: #555;">
                Interested in these stories and more? Explore the full feed at
                <a href="{{{FEED_URL}}}" style="color: #1a1a1a; font-weight: 600; text-decoration: underline;">The Latest Times &rarr;</a>
                </p>
            </td>
          </tr>

          <!-- Personal news section header -->
          <tr>
            <td style="padding: 28px 32px 0 32px; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.08em;">Your Personal News Updates</p>
            </td>
          </tr>

          <!-- Interest summary or caught-up message -->
          <tr>
            <td style="padding: 12px 32px 16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                {{{INTERESTS_SUMMARY}}}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 32px 32px 32px;" align="center">
              <a href="{{{FEED_URL}}}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff;
                 text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 28px;
                 border-radius: 6px; letter-spacing: 0.01em;">
                Go to The Latest Times &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 32px 28px 32px; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 11px; color: #bbb; text-align: center;">
                Sent by The Latest Times &mdash; <a href="{{{FEED_URL}}}" style="color: #bbb;">To unsubscribe, visit your dashboard settings</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


if __name__ == "__main__":
    from openfeed.config import settings

    create_template_digest(settings.resend_api_key)
