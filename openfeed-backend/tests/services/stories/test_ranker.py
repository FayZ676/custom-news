from openfeed.clients.iptc.taxonomy import load_taxonomy
from openfeed.services.stories.ranker import score_story


def _taxonomy():
    return load_taxonomy()


# Flat topics used by the simplified classifier.


def test_exact_liked_match_is_positive():
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:11000000"],
        preferences={"medtop:11000000": "liked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert score > 0


def test_disliked_gives_negative_score():
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:11000000"],
        preferences={"medtop:11000000": "disliked"},
        taxonomy=t,
        significance_score=0.0,
    )
    assert score < 0


def test_unrelated_preference_gives_no_contribution():
    t = _taxonomy()
    score = score_story(
        story_topics=["medtop:11000000"],
        preferences={"medtop:04000000": "disliked"},
        taxonomy=t,
        significance_score=0.0,
    )
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
