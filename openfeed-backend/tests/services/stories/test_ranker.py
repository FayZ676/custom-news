from openfeed.services.stories.ranker import score_story

# Flat topics used by the simplified classifier.


def test_exact_liked_match_is_positive():
    score = score_story(
        story_topics=["11"],
        preferences={"11": "liked"},
        significance_score=0.0,
    )
    assert score > 0


def test_disliked_gives_negative_score():
    score = score_story(
        story_topics=["11"],
        preferences={"11": "disliked"},
        significance_score=0.0,
    )
    assert score < 0


def test_unrelated_preference_gives_no_contribution():
    score = score_story(
        story_topics=["11"],
        preferences={"04": "disliked"},
        significance_score=0.0,
    )
    assert score == 0.0


def test_cold_start_returns_significance_score():
    sig = 0.85
    score = score_story(
        story_topics=["11"],
        preferences={},
        significance_score=sig,
    )
    assert score == sig


def test_final_score_weights_applied_correctly():
    # Direct match contributes BASE_WEIGHT = 1.0.
    sig = 0.5
    expected = 0.7 * 1.0 + 0.3 * sig
    score = score_story(
        story_topics=["11"],
        preferences={"11": "liked"},
        significance_score=sig,
        w1=0.7,
        w2=0.3,
    )
    assert abs(score - expected) < 1e-9


def test_multiple_liked_topics_accumulate():
    single = score_story(
        story_topics=["11"],
        preferences={"11": "liked"},
        significance_score=0.0,
    )
    multi = score_story(
        story_topics=["11", "04"],
        preferences={"11": "liked", "04": "liked"},
        significance_score=0.0,
    )
    assert multi > single


def test_unknown_topic_id_ignored():
    score = score_story(
        story_topics=["legacy:NONEXISTENT"],
        preferences={"11": "liked"},
        significance_score=0.0,
    )
    assert score == 0.0


def test_liked_and_disliked_on_same_story_cancel():
    """A story tagged with one liked and one disliked topic at equal depth nets out."""
    score = score_story(
        story_topics=["11", "04"],
        preferences={"11": "liked", "04": "disliked"},
        significance_score=0.0,
    )
    assert score == 0.0


def test_topic_ids_normalize_to_flat_topic_ids():
    score = score_story(
        story_topics=["11"],
        preferences={"11": "liked"},
        significance_score=0.0,
    )
    assert score > 0
