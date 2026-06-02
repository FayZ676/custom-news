from dataclasses import dataclass
from typing import Literal

from openfeed.db.queries.global_stories import StoryWithTopics
from openfeed.services.topics import normalize_topic_id

Preference = Literal["liked", "disliked"]
UserPreferences = dict[str, Preference]  # medtop_id → "liked" | "disliked"

_BASE_WEIGHT = 1.0


def _preference_contribution(
    topic_id: str,
    preferences: UserPreferences,
) -> float:
    """Compute the preference contribution for a single story topic tag."""
    normalized_topic_id = normalize_topic_id(topic_id)
    if normalized_topic_id not in preferences:
        return 0.0

    return (
        _BASE_WEIGHT if preferences[normalized_topic_id] == "liked" else -_BASE_WEIGHT
    )


def score_story(
    story_topics: list[str],
    preferences: UserPreferences,
    significance_score: float,
    w1: float = 0.7,
    w2: float = 0.3,
) -> float:
    """Compute the final ranked score for a story.

    Cold start: if preferences is empty, returns significance_score directly
    so the feed degrades gracefully to a global trending view.

    Args:
        story_topics:       list of medtop_ids tagged on the story
        preferences:        user's liked/disliked medtop_id map
        significance_score: pre-computed cluster significance (0..N)
        w1:                 weight for preference score (default 0.7)
        w2:                 weight for significance score (default 0.3)
    """
    if not preferences:
        return significance_score

    normalized_preferences: UserPreferences = {
        normalize_topic_id(topic_id): preference
        for topic_id, preference in preferences.items()
    }

    preference_score = sum(
        _preference_contribution(topic_id, normalized_preferences)
        for topic_id in story_topics
    )
    return w1 * preference_score + w2 * significance_score


@dataclass(frozen=True)
class ScoredStory:
    story_with_topics: StoryWithTopics
    final_score: float


def rank_stories(
    stories: list[StoryWithTopics],
    preferences: UserPreferences,
) -> list[ScoredStory]:
    """Score each story against user preferences and return them sorted descending."""
    scored = [
        ScoredStory(
            story_with_topics=s,
            final_score=score_story(
                story_topics=s.topic_ids,
                preferences=preferences,
                significance_score=s.story.score,
            ),
        )
        for s in stories
    ]
    return sorted(scored, key=lambda s: s.final_score, reverse=True)
