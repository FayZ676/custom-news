import math
from datetime import datetime, timezone

from pydantic import BaseModel

from openfeed.database_models import PublicGlobalArticles


class ClusterScore(BaseModel):
    score: float
    velocity: float


def score_cluster(
    articles: list[PublicGlobalArticles],
    topic_impact: float,
    min_topic_impact: float = 0.1,
    max_topic_impact: float = 2.0,
) -> ClusterScore:
    now = datetime.now(timezone.utc)
    timestamps = list(map(_normalize_timestamp, articles))

    if not timestamps:
        return ClusterScore(score=0.0, velocity=0.0)

    oldest, newest = min(timestamps), max(timestamps)
    window_hours = max(math.ceil((now - oldest).total_seconds() / 3600) + 1, 72)

    buckets = [
        _to_hour_bucket(now, ts)
        for ts in timestamps
        if 0 <= _to_hour_bucket(now, ts) < window_hours
    ]
    bins = _build_bins(window_hours, buckets)

    histogram, ema_fast = _macd(bins, slow_period=min(window_hours, 72))

    hours_since_newest = (now - newest).total_seconds() / 3600
    recency_decay = math.exp(-hours_since_newest / 24)
    clamped_impact = min(max(topic_impact, min_topic_impact), max_topic_impact)

    return ClusterScore(
        score=ema_fast[-1] * clamped_impact * recency_decay,
        velocity=max(-1.0, min(1.0, histogram / max(ema_fast[-1], 1.0))),
    )


def _macd(
    values: list[float],
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> tuple[float, list[float]]:
    # https://en.wikipedia.org/wiki/MACD
    ema_fast = _ema(values, fast_period)
    ema_slow = _ema(values, slow_period)
    macd_line = [f - s for f, s in zip(ema_fast, ema_slow)]
    signal_line = _ema(macd_line, signal_period)
    histogram = macd_line[-1] - signal_line[-1]
    return histogram, ema_fast


def _ema(values: list[float], period: int) -> list[float]:
    # https://en.wikipedia.org/wiki/Exponential_smoothing
    k = 2 / (period + 1)
    result: list[float] = []
    for v in values:
        result.append(v * k + result[-1] * (1 - k) if result else v)
    return result


def _normalize_timestamp(a: PublicGlobalArticles) -> datetime:
    return (
        a.published_at.replace(tzinfo=timezone.utc)
        if a.published_at.tzinfo is None
        else a.published_at
    )


def _to_hour_bucket(now: datetime, ts: datetime) -> int:
    return int((now - ts).total_seconds() / 3600)


def _build_bins(window_hours: int, buckets: list[int]) -> list[float]:
    return [float(buckets.count(window_hours - 1 - i)) for i in range(window_hours)]
