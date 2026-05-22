"""LLM-based IPTC classifier (two-pass GPT pipeline)."""

import logging

from pydantic import BaseModel, field_validator

from openfeed.iptc.taxonomy import (
    Taxonomy,
    get_root_ids,
    get_subtree,
    render_prompt_tree,
)
from openfeed.openai_client import OpenAIClient

logger = logging.getLogger(__name__)

_PASS1_PROMPT = """\
You are a news classifier using the IPTC Media Topics taxonomy.

Given the article below, identify ALL top-level IPTC categories that apply.
Return their qcodes (e.g. "medtop:11000000") in the top_level_ids field.
Most articles belong to one category; some legitimately span two or three.
Only include a category if the article substantially covers that topic.

Available top-level categories (qcode — name — definition):
{tree}

Article:
{text}
"""

_PASS2_PROMPT = """\
You are a news classifier using the IPTC Media Topics taxonomy.

Given the article below, return the qcode of the SINGLE most specific IPTC topic
from the subtree below that best describes the article's primary focus within
this branch. Return the qcode (e.g. "medtop:20000579") in the medtop_id field.
Choose the deepest term that is accurate — do not over-generalise.

Topic subtree (qcode — name — definition):
{tree}

Article:
{text}
"""


class _Pass1Response(BaseModel):
    top_level_ids: list[str]

    @field_validator("top_level_ids")
    @classmethod
    def _only_valid_qcodes(cls, ids: list[str]) -> list[str]:
        return [mid for mid in ids if mid.startswith("medtop:")]


class _Pass2Response(BaseModel):
    medtop_id: str


def _run_pass1(
    text: str,
    taxonomy: Taxonomy,
    client: OpenAIClient,
) -> list[str]:
    """Call Pass 1: return valid top-level medtop_ids for the given text."""
    prompt = _PASS1_PROMPT.format(
        tree=render_prompt_tree(get_root_ids(taxonomy), taxonomy),
        text=text,
    )
    result = client.generate_response("gpt-5.4-nano", prompt, _Pass1Response)
    valid = [mid for mid in result.top_level_ids if mid in taxonomy]
    if not valid:
        logger.warning("Pass 1 returned no valid top-level IDs for text: %.80s", text)
    return valid


def _run_pass2(
    text: str,
    top_id: str,
    taxonomy: Taxonomy,
    client: OpenAIClient,
) -> str | None:
    """Call Pass 2 for one branch: return the most specific topic, or None."""
    prompt = _PASS2_PROMPT.format(
        tree=render_prompt_tree(get_subtree(top_id, taxonomy), taxonomy),
        text=text,
    )
    result = client.generate_response("gpt-5.4-nano", prompt, _Pass2Response)
    if result.medtop_id not in taxonomy:
        logger.warning(
            "Pass 2 returned unknown medtop_id %r for top-level %r",
            result.medtop_id,
            top_id,
        )
        return None
    return result.medtop_id


def classify_article_llm(
    text: str,
    taxonomy: Taxonomy,
    client: OpenAIClient,
) -> list[str]:
    """Classify an article using a two-pass LLM pipeline.

    Pass 1 (gpt-5.4-nano): identifies all applicable top-level IPTC categories.
    Pass 2 (gpt-5.4-nano):      for each top-level result, finds the most specific
                           matching term within that branch.

    Returns a flat list of ClassifiedTopic, one per admitted branch.
    """
    top_ids = _run_pass1(text, taxonomy, client)
    if not top_ids:
        return []

    pass2_topics = [
        t
        for top_id in top_ids
        if (t := _run_pass2(text, top_id, taxonomy, client)) is not None
    ]

    merged: dict[str, str] = {mid: mid for mid in top_ids}
    for t in pass2_topics:
        merged[t] = t

    return list(merged.values())
