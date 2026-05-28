from dataclasses import dataclass

from openfeed.db.global_stories import StoryWithTopics
from openfeed.clients.iptc.scorer import UserPreferences, score_story
from openfeed.clients.iptc.taxonomy import Taxonomy


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
