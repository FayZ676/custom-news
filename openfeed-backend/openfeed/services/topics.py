import re
from typing import cast

# Root topic taxonomy used across enrichment, scoring, and user preferences.
# Topic labels are sourced from the IPTC Media Topics root taxonomy.
TOPICS: tuple[dict[str, str | float], ...] = (
    {
        "id": "01",
        "name": "arts, culture, entertainment and media",
        "description": "All forms of arts, entertainment, cultural heritage and media",
        "significance_score": 0.20,
    },
    {
        "id": "02",
        "name": "crime, law and justice",
        "description": "The establishment and statement of the rules of behavior in society, the enforcement of these rules, breaches of the rules, the punishment of offenders and the organizations and bodies involved in these activities",
        "significance_score": 0.65,
    },
    {
        "id": "03",
        "name": "disaster, accident and emergency incident",
        "description": "Man made or natural event resulting in loss of life or injury to living creatures and or damage to objects or property",
        "significance_score": 0.85,
    },
    {
        "id": "04",
        "name": "economy, business and finance",
        "description": "All matters concerning the planning, production and exchange of wealth",
        "significance_score": 0.70,
    },
    {
        "id": "05",
        "name": "education",
        "description": "All aspects of furthering knowledge, formally or informally",
        "significance_score": 0.30,
    },
    {
        "id": "06",
        "name": "environment",
        "description": "The protection, damage, and condition of the ecosystem of the planet Earth and its surroundings",
        "significance_score": 0.60,
    },
    {
        "id": "07",
        "name": "health",
        "description": "All aspects of physical and mental well-being",
        "significance_score": 0.80,
    },
    {
        "id": "08",
        "name": "human interest",
        "description": "Items that discuss individuals, groups, animals, plants or objects in an emotional way",
        "significance_score": 0.15,
    },
    {
        "id": "09",
        "name": "labor",
        "description": "Social aspects, organizations, rules and conditions affecting employment and economic support of the unemployed",
        "significance_score": 0.50,
    },
    {
        "id": "10",
        "name": "lifestyle and leisure",
        "description": "Activities undertaken for pleasure, relaxation or recreation outside paid employment, including eating and travel",
        "significance_score": 0.20,
    },
    {
        "id": "11",
        "name": "politics and government",
        "description": "Local, regional, national and international exercise of power and day-to-day running of government",
        "significance_score": 0.75,
    },
    {
        "id": "12",
        "name": "religion",
        "description": "Belief systems, institutions and people who provide moral guidance to followers",
        "significance_score": 0.20,
    },
    {
        "id": "13",
        "name": "science and technology",
        "description": "All aspects pertaining to scientific understanding and research of natural, formal and social sciences",
        "significance_score": 0.55,
    },
    {
        "id": "14",
        "name": "society",
        "description": "Concerns, issues, affairs and institutions relevant to human social interactions, problems and welfare",
        "significance_score": 0.35,
    },
    {
        "id": "15",
        "name": "sport",
        "description": "Competitive activity or skill involving physical and or mental effort and related organizations",
        "significance_score": 0.25,
    },
    {
        "id": "16",
        "name": "conflict, war and peace",
        "description": "Protest or violence, military activities, geopolitical conflicts, and resolution efforts",
        "significance_score": 0.90,
    },
    {
        "id": "17",
        "name": "weather",
        "description": "The study, prediction and reporting of meteorological phenomena",
        "significance_score": 0.35,
    },
)

_TOPIC_NAME_BY_ID = {topic["id"]: cast(str, topic["name"]) for topic in TOPICS}

_ROOT_NUMERIC_RE = re.compile(r"^(\d{1,2})$")


def normalize_topic_id(value: str) -> str:
    """Normalize topic IDs to a canonical 2-digit form."""
    topic_id = value.strip().lower()
    if match := _ROOT_NUMERIC_RE.fullmatch(topic_id):
        return f"{int(match.group(1)):02d}"
    return topic_id


def to_topic_payload(topic_ids: list[str]) -> list[dict[str, str]]:
    unique_valid_ids = list(
        dict.fromkeys(
            topic_id
            for topic_id in (normalize_topic_id(topic) for topic in topic_ids)
            if topic_id in _TOPIC_NAME_BY_ID
        )
    )
    return [
        {"id": topic_id, "name": _TOPIC_NAME_BY_ID[topic_id]}
        for topic_id in unique_valid_ids
    ]


def topic_significance_score(topic_ids: list[str]) -> float:
    normalized_topic_ids = {normalize_topic_id(topic_id) for topic_id in topic_ids}
    scores = [
        float(topic["significance_score"])
        for topic in TOPICS
        if topic["id"] in normalized_topic_ids
    ]
    return sum(scores) / len(scores) if scores else 0.0


def format_topics_for_prompt() -> str:
    return "\n".join(
        f"- {topic['id']}: {topic['name']}"
        for topic in sorted(
            TOPICS,
            key=lambda topic: (
                -float(topic["significance_score"]),
                cast(str, topic["id"]),
            ),
        )
    )
