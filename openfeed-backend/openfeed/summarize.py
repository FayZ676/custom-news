import logging
import os
import re
from html.parser import HTMLParser

import requests

from openfeed.config import settings

logger = logging.getLogger(__name__)

_SUMMARY_PROMPT = (
    "You are a helpful assistant. Summarize the following news article in 2–3 sentences. "
    "Focus on the key facts and be concise."
)

_SKIP_TAGS = {"script", "style", "head", "nav", "footer", "header", "aside", "form"}


class _ArticleTextExtractor(HTMLParser):
    """Extracts visible text from an HTML page, skipping non-content tags."""

    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []
        self._skip_depth: int = 0

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag.lower() in _SKIP_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in _SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0:
            stripped = data.strip()
            if stripped:
                self._parts.append(stripped)

    def get_text(self) -> str:
        return " ".join(self._parts)


def _fetch_article_text(url: str) -> str:
    """Fetch the article at *url* and return its cleaned visible text."""
    response = requests.get(
        url,
        timeout=(10, 20),
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()
    extractor = _ArticleTextExtractor()
    extractor.feed(response.text)
    text = re.sub(r"\s+", " ", extractor.get_text()).strip()
    return text[: settings.summarization_max_input_chars]


def generate_summary(url: str) -> str | None:
    """Generate a short summary for the article at *url* using an LLM.

    Fetches the article page, extracts visible text, and calls the OpenAI
    chat completions API to produce a 2–3 sentence summary.  Returns ``None``
    if the page cannot be fetched or the API call fails.
    """
    try:
        article_text = _fetch_article_text(url)
    except Exception as e:
        logger.warning("Failed to fetch article at %s: %s", url, e)
        return None

    if not article_text:
        logger.warning("No text extracted from article at %s", url)
        return None

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.warning("OPENAI_API_KEY is not set; skipping summary generation for %s", url)
        return None

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.summarization_model,
                "messages": [
                    {"role": "system", "content": _SUMMARY_PROMPT},
                    {"role": "user", "content": article_text},
                ],
                "max_tokens": settings.summarization_max_tokens,
                "temperature": 0.3,
            },
            timeout=(10, 60),
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning("Failed to generate summary for %s: %s", url, e)
        return None
