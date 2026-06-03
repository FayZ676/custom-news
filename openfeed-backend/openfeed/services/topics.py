import re

from openfeed.db.models import PublicGlobalTopics

_ROOT_NUMERIC_RE = re.compile(r"^(\d{1,2})$")


def normalize_topic_id(value: str) -> str:
    """Normalize topic IDs to a canonical 2-digit form."""
    topic_id = value.strip().lower()
    if match := _ROOT_NUMERIC_RE.fullmatch(topic_id):
        return f"{int(match.group(1)):02d}"
    return topic_id


def to_topic_payload(
    topic_ids: list[str],
    topics: list[PublicGlobalTopics],
) -> list[dict[str, str]]:
    topic_name_by_id = {topic.id: topic.name for topic in topics}
    unique_valid_ids = list(
        dict.fromkeys(
            topic_id
            for topic_id in (normalize_topic_id(topic) for topic in topic_ids)
            if topic_id in topic_name_by_id
        )
    )
    return [
        {"id": topic_id, "name": topic_name_by_id[topic_id]}
        for topic_id in unique_valid_ids
    ]


def topic_significance_score(
    topic_ids: list[str],
    topics: list[PublicGlobalTopics],
) -> float:
    normalized_topic_ids = {normalize_topic_id(topic_id) for topic_id in topic_ids}
    scores = [
        topic.significance_score for topic in topics if topic.id in normalized_topic_ids
    ]
    return sum(scores) / len(scores) if scores else 0.0


def format_topics_for_prompt(topics: list[PublicGlobalTopics]) -> str:
    return "\n".join(
        f"- {topic.id}: {topic.name}"
        for topic in sorted(
            topics,
            key=lambda topic: (
                -topic.significance_score,
                topic.id,
            ),
        )
    )
