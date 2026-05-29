from dataclasses import dataclass
from typing import Literal

from openfeed.db.queries.global_stories import StoryWithTopics
from openfeed.clients.iptc.taxonomy import Taxonomy

Preference = Literal["liked", "disliked"]
UserPreferences = dict[str, Preference]  # medtop_id → "liked" | "disliked"

_BASE_WEIGHT = 1.0


def _preference_contribution(
    topic_id: str,
    preferences: UserPreferences,
    taxonomy: Taxonomy,
) -> float:
    """Compute the preference contribution for a single story topic tag.

    Walks the ancestor chain from the most specific node (self) up to the root,
    stopping at the nearest ancestor that has an explicit preference. A direct
    match (distance 0) contributes BASE_WEIGHT; each additional hop halves the
    weight. Disliked ancestors contribute negatively with the same decay.
    """
    if topic_id not in taxonomy:
        return 0.0

    # ancestors is ordered root→self; reverse to walk most-specific-first
    for distance, ancestor_id in enumerate(reversed(taxonomy[topic_id].ancestors)):
        if ancestor_id in preferences:
            weight = _BASE_WEIGHT / (distance + 1)
            return weight if preferences[ancestor_id] == "liked" else -weight

    return 0.0


def score_story(
    story_topics: list[str],
    preferences: UserPreferences,
    taxonomy: Taxonomy,
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
        taxonomy:           loaded IPTC taxonomy
        significance_score: pre-computed cluster significance (0..N)
        w1:                 weight for preference score (default 0.7)
        w2:                 weight for significance score (default 0.3)
    """
    if not preferences:
        return significance_score

    preference_score = sum(
        _preference_contribution(topic_id, preferences, taxonomy)
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
    taxonomy: Taxonomy,
) -> list[ScoredStory]:
    """Score each story against user preferences and return them sorted descending."""
    scored = [
        ScoredStory(
            story_with_topics=s,
            final_score=score_story(
                story_topics=s.topic_ids,
                preferences=preferences,
                taxonomy=taxonomy,
                significance_score=s.story.score,
            ),
        )
        for s in stories
    ]
    return sorted(scored, key=lambda s: s.final_score, reverse=True)
