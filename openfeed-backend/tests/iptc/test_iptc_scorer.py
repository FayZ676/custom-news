from pathlib import Path

from openfeed.iptc.taxonomy import load_taxonomy
from openfeed.iptc.scorer import score_story

TAXONOMY_PATH = (
    Path(__file__).parent.parent / "openfeed" / "iptc" / "iptc-taxonomy.json"
)


def _taxonomy():
    return load_taxonomy(TAXONOMY_PATH)


# medtop:11000000 = politics (root, depth 0)
# medtop:20000574 = election (child of politics, depth 1)
# medtop:20000579 = national elections (grandchild of politics, depth 2)
# medtop:04000000 = economy, business and finance (separate root)


def test_exact_liked_match_is_positive():
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:11000000"],
        preferences={"medtop:11000000": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert score > 0


def test_direct_match_scores_more_than_via_parent():
    t = _taxonomy()
    direct = score_story(
        story_topics=["medtop:20000579"],
        preferences={"medtop:20000579": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    via_parent = score_story(
        story_topics=["medtop:20000579"],
        preferences={"medtop:11000000": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert direct > via_parent > 0


def test_parent_scores_more_than_grandparent():
    t = _taxonomy()
    via_parent = score_story(
        story_topics=["medtop:20000579"],
        preferences={"medtop:20000574": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    via_grandparent = score_story(
        story_topics=["medtop:20000579"],
        preferences={"medtop:11000000": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert via_parent > via_grandparent > 0


def test_disliked_gives_negative_score():
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:11000000"],
        preferences={"medtop:11000000": "disliked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert score < 0


def test_disliked_child_does_not_affect_parent_tagged_story():
    """Disliking a child should not penalise a story tagged only at the parent."""
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:11000000"],  # tagged at root only
        preferences={"medtop:20000579": "disliked"},  # dislike is a grandchild
        taxonomy=t,
        significance_score=0.0,
    )
    # Ancestor walk from medtop:11000000 never reaches medtop:20000588 → no contribution
    assert score == 0.0


def test_cold_start_returns_significance_score():
    t = _taxonomy()
    sig = 0.85
    score = score_story(
        story_topics=["medtop:11000000"],
        preferences={},
        taxonomy=t,
        significance_score=sig,
    )
    assert score == sig


def test_final_score_weights_applied_correctly():
    t = _taxonomy()
    # Direct match → preference_contribution = BASE_WEIGHT / 1 = 1.0
    sig = 0.5
    expected = 0.7 * 1.0 + 0.3 * sig
    score = score_story(
        story_topics=["medtop:11000000"],
        preferences={"medtop:11000000": "liked"},
        taxonomy=t,
        significance_score=sig,
        w1=0.7,
        w2=0.3,
    )
    assert abs(score - expected) < 1e-9


def test_multiple_liked_topics_accumulate():
    t = _taxonomy()
    single = score_story(
        story_topics=["medtop:11000000"],
        preferences={"medtop:11000000": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    multi = score_story(
        story_topics=["medtop:11000000", "medtop:04000000"],
        preferences={"medtop:11000000": "liked", "medtop:04000000": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert multi > single


def test_unknown_topic_id_ignored():
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:NONEXISTENT"],
        preferences={"medtop:11000000": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert score == 0.0


def test_liked_and_disliked_on_same_story_cancel():
    """A story tagged with one liked and one disliked topic at equal depth nets out."""
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:11000000", "medtop:04000000"],
        preferences={"medtop:11000000": "liked", "medtop:04000000": "disliked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert score == 0.0
