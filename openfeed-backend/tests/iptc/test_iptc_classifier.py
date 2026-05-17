"""Integration tests for the IPTC two-pass classifier.

These tests make real OpenAI API calls and require a valid OPENAI_API_KEY in .env.
Article text is pinned inline (no live DB connection needed) using real articles
sampled from the local Supabase instance.

Run with: pytest tests/test_iptc_classifier.py -v
"""

from pathlib import Path

import pytest

from openfeed.iptc.taxonomy import load_taxonomy, get_root_ids, Taxonomy
from openfeed.iptc.classifier import classify_article, ClassifiedTopic
from openfeed.openai_client import openai_client

TAXONOMY_PATH = (
    Path(__file__).parent.parent / "openfeed" / "iptc" / "iptc-taxonomy.json"
)

# Real articles sampled from local Supabase, pinned by title + summary.
# expected_root is the IPTC top-level category we expect Pass 1 to include.
FIXTURES = [
    {
        "title": (
            "US orders travelers on Air Force One to throw away gifts, pins, "
            "and burner phones after China trip"
        ),
        "summary": (
            "The U.S. ordered travelers on Air Force One to discard gifts, pins, and "
            "burner phones after a China trip amid concerns about China's intelligence "
            "and espionage capabilities."
        ),
        "expected_root": "medtop:11000000",  # politics
    },
    {
        "title": "Tesla reveals two Robotaxi crashes involving teleoperators",
        "summary": (
            "Tesla disclosed newly unredacted crash reports detailing two Robotaxi "
            "crashes involving teleoperators as it works to scale its autonomous "
            "ride-hailing service."
        ),
        "expected_root": "medtop:13000000",  # science and technology
    },
    {
        "title": (
            "OpenAI launches ChatGPT for personal finance, "
            "will let you connect bank accounts"
        ),
        "summary": (
            "OpenAI launched ChatGPT for personal finance, enabling users to connect "
            "bank accounts and view a dashboard covering portfolio performance, "
            "spending, subscriptions, and upcoming payments."
        ),
        "expected_root": "medtop:04000000",  # economy, business and finance
    },
]


@pytest.fixture(scope="module")
def taxonomy():
    return load_taxonomy(TAXONOMY_PATH)


@pytest.fixture(scope="module")
def classified(taxonomy):
    """Run classify_article once per fixture — shared across all assertions."""
    return {
        f["title"]: (
            f,
            classify_article(
                f"{f['title']}\n\n{f['summary']}", taxonomy, openai_client
            ),
        )
        for f in FIXTURES
    }


def _within_pass1_branch(
    t: ClassifiedTopic, taxonomy: Taxonomy, pass1_ids: set[str]
) -> bool:
    return bool(set(taxonomy[t.medtop_id].ancestors) & pass1_ids)


@pytest.mark.parametrize(
    "title", [f["title"] for f in FIXTURES], ids=[f["title"][:50] for f in FIXTURES]
)
def test_classifier(taxonomy, classified, title):
    """All structural invariants for one article in a single test.

    - Pass 1 returns only root IDs
    - Expected root is present in Pass 1 results
    - Pass 2 IDs are within their Pass 1 branch
    - Pass 2 IDs are at least as deep as their Pass 1 parent
    """
    fixture, topics = classified[title]
    root_ids = set(get_root_ids(taxonomy))

    pass1_ids = {t.medtop_id for t in topics if t.pass_number == 1}
    pass2_topics = [t for t in topics if t.pass_number == 2]

    assert all(
        mid in root_ids for mid in pass1_ids
    ), f"Pass 1 returned non-root IDs: {[mid for mid in pass1_ids if mid not in root_ids]}"

    expected = fixture["expected_root"]
    assert expected in pass1_ids, (
        f"Expected {expected} ({taxonomy[expected].name}) in Pass 1 results, "
        f"got: {[taxonomy[mid].name for mid in pass1_ids]}"
    )

    assert all(_within_pass1_branch(t, taxonomy, pass1_ids) for t in pass2_topics), (
        f"Pass 2 results outside Pass 1 branches: "
        f"{[t.medtop_id for t in pass2_topics if not _within_pass1_branch(t, taxonomy, pass1_ids)]}"
    )
