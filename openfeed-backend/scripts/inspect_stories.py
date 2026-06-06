"""
Generates two CSV files for clustering inspection:

  stories.csv      — all stories ordered by score, with grouped article titles
  near_misses.csv  — singleton stories and their closest multi-article cluster,
                     including per-signal breakdown

Usage:
    cd openfeed-backend
    .venv/bin/python scripts/inspect_stories.py
"""

import csv
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from openfeed.db.client import client
from openfeed.db.models import PublicGlobalArticles
from openfeed.clusterer import (
    _hours_between,
    _keyword_tokens,
    _overlap_coefficient,
    score_pair,
)

sys.path.insert(0, str(Path(__file__).parent.parent))


OUTPUT_DIR = Path(__file__).parent.parent.parent
STORIES_CSV = OUTPUT_DIR / "stories.csv"
NEAR_MISSES_CSV = OUTPUT_DIR / "near_misses.csv"

NEAR_MISS_MIN_SCORE = (
    0.10  # Singletons scoring below this against all clusters are excluded as noise
)


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Story:
    headline: str
    score: float
    articles: list[PublicGlobalArticles]

    @property
    def is_singleton(self) -> bool:
        return len(self.articles) == 1


@dataclass(frozen=True)
class NearMiss:
    best_score: float
    singleton_title: str
    cluster_headline: str
    best_match_title: str
    embedding_sim: Optional[float]
    entity_jaccard: float
    keyword_overlap: float
    hours_apart: float
    singleton_summary: str


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------


def _fetch_raw_stories(db) -> list[dict]:
    return (
        db.table("global_stories")
        .select("id, headline, score, related_articles_urls")
        .order("score", desc=True)
        .execute()
        .data
    )


def _fetch_articles_by_url(db, urls: list[str]) -> dict[str, PublicGlobalArticles]:
    if not urls:
        return {}

    url_set = set(urls)
    rows = (
        db.table("global_articles")
        .select(
            "id, title, summary, "
            "published_at, feed_title, significance_score, url, image_url, created_at"
        )
        .execute()
        .data
    )
    articles = {}
    for row in rows:
        if row["url"] not in url_set:
            continue
        article = PublicGlobalArticles(**row)
        articles[article.url] = article
    return articles


def fetch_stories(db) -> list[Story]:
    raw_stories = _fetch_raw_stories(db)
    all_urls = [url for s in raw_stories for url in (s["related_articles_urls"] or [])]
    articles_by_url = _fetch_articles_by_url(db, all_urls)

    return [
        Story(
            headline=s["headline"],
            score=round(s["score"], 4),
            articles=[
                articles_by_url[url]
                for url in (s["related_articles_urls"] or [])
                if url in articles_by_url
            ],
        )
        for s in raw_stories
    ]


# ---------------------------------------------------------------------------
# Near miss detection
# ---------------------------------------------------------------------------


def _signal_breakdown(a: PublicGlobalArticles, b: PublicGlobalArticles) -> dict:
    return {
        "keyword_overlap": round(
            _overlap_coefficient(_keyword_tokens(a), _keyword_tokens(b)), 4
        ),
        "hours_apart": round(_hours_between(a.published_at, b.published_at), 1),
    }


def _best_score_against_cluster(
    singleton: PublicGlobalArticles,
    cluster: Story,
) -> tuple[float, PublicGlobalArticles]:
    """Return the highest score and the matching article within the cluster."""
    scored = [(score_pair(singleton, member), member) for member in cluster.articles]
    return max(scored, key=lambda x: x[0])


def find_near_misses(stories: list[Story]) -> list[NearMiss]:
    """
    For each singleton, find the multi-article cluster it scores closest to.
    Results are sorted by score descending — highest priority false negatives first.
    """
    singletons = [s for s in stories if s.is_singleton]
    clusters = [s for s in stories if not s.is_singleton]

    near_misses = []
    for singleton_story in singletons:
        article = singleton_story.articles[0]
        best_score, best_match, best_cluster = max(
            (
                (*_best_score_against_cluster(article, cluster), cluster)
                for cluster in clusters
            ),
            key=lambda x: x[0],
            default=(None, None, None),
        )

        if best_score is None or best_match is None or best_cluster is None:
            continue
        if best_score < NEAR_MISS_MIN_SCORE:
            continue

        near_misses.append(
            NearMiss(
                best_score=round(best_score, 4),
                singleton_title=article.title,
                cluster_headline=best_cluster.headline,
                best_match_title=best_match.title,
                singleton_summary=(article.summary or "")[:200],
                **_signal_breakdown(article, best_match),
            )
        )

    return sorted(near_misses, key=lambda x: x.best_score, reverse=True)


# ---------------------------------------------------------------------------
# CSV writers
# ---------------------------------------------------------------------------


def write_stories_csv(stories: list[Story], path: Path) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["score", "article_count", "headline", "grouped_articles"]
        )
        writer.writeheader()
        for s in stories:
            writer.writerow(
                {
                    "score": s.score,
                    "article_count": len(s.articles),
                    "headline": s.headline,
                    "grouped_articles": " | ".join(a.title for a in s.articles),
                }
            )
    print(f"Wrote {len(stories)} stories → {path}")


def write_near_misses_csv(near_misses: list[NearMiss], path: Path) -> None:
    fields = [
        "best_score",
        "singleton_title",
        "cluster_headline",
        "best_match_title",
        "embedding_sim",
        "entity_jaccard",
        "keyword_overlap",
        "hours_apart",
        "singleton_summary",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for nm in near_misses:
            writer.writerow(
                {
                    "best_score": nm.best_score,
                    "singleton_title": nm.singleton_title,
                    "cluster_headline": nm.cluster_headline,
                    "best_match_title": nm.best_match_title,
                    "embedding_sim": nm.embedding_sim,
                    "entity_jaccard": nm.entity_jaccard,
                    "keyword_overlap": nm.keyword_overlap,
                    "hours_apart": nm.hours_apart,
                    "singleton_summary": nm.singleton_summary,
                }
            )
    print(f"Wrote {len(near_misses)} near misses → {path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    db = client()

    print("Fetching stories and articles...")
    stories = fetch_stories(db)
    write_stories_csv(stories, STORIES_CSV)

    print("Computing near misses...")
    near_misses = find_near_misses(stories)
    write_near_misses_csv(near_misses, NEAR_MISSES_CSV)


if __name__ == "__main__":
    main()
