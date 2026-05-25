import logging
import threading
import time
import re
from dataclasses import dataclass, field

# Fraction of remaining capacity below which the limiter sleeps until reset.
# e.g. 0.05 means: throttle once remaining drops below 5% of the limit.
_RATE_LIMIT_RESERVE: float = 0.05


def _parse_reset_delta(value: str) -> float:
    """Parse OpenAI's compact reset duration strings into seconds.

    Handles formats like '1s', '6m0s', '1h30m0s', '500ms'.
    """
    total = 0.0
    for amount, unit in re.findall(r"(\d+(?:\.\d+)?)(h|m(?!s)|s|ms)", value):
        match unit:
            case "h":
                total += float(amount) * 3600
            case "m":
                total += float(amount) * 60
            case "s":
                total += float(amount)
            case "ms":
                total += float(amount) / 1000
    return total


@dataclass
class RateLimiter:
    """Thread-safe, proactive rate limiter driven by OpenAI response headers.

    Reads x-ratelimit-* headers from every successful response and uses them
    to proactively sleep before the next request whenever remaining capacity
    drops below the configured reserve fraction of the limit.
    """

    _lock: threading.Lock = field(
        default_factory=threading.Lock, init=False, repr=False
    )
    _remaining_requests: int | None = field(default=None, init=False)
    _remaining_tokens: int | None = field(default=None, init=False)
    _limit_requests: int | None = field(default=None, init=False)
    _limit_tokens: int | None = field(default=None, init=False)
    _requests_reset_at: float | None = field(
        default=None, init=False
    )  # monotonic seconds
    _tokens_reset_at: float | None = field(
        default=None, init=False
    )  # monotonic seconds

    def update_from_headers(self, headers) -> None:
        """Update rate limit state from the HTTP headers of a successful response."""
        now = time.monotonic()
        with self._lock:
            if (v := headers.get("x-ratelimit-remaining-requests")) is not None:
                self._remaining_requests = int(v)
            if (v := headers.get("x-ratelimit-remaining-tokens")) is not None:
                self._remaining_tokens = int(v)
            if (v := headers.get("x-ratelimit-limit-requests")) is not None:
                self._limit_requests = int(v)
            if (v := headers.get("x-ratelimit-limit-tokens")) is not None:
                self._limit_tokens = int(v)
            if (v := headers.get("x-ratelimit-reset-requests")) is not None:
                self._requests_reset_at = now + _parse_reset_delta(v)
            if (v := headers.get("x-ratelimit-reset-tokens")) is not None:
                self._tokens_reset_at = now + _parse_reset_delta(v)

    def acquire(self, estimated_tokens: int = 0) -> None:
        """Reserve capacity for one request before firing it.

        Atomically checks remaining capacity and pessimistically decrements
        both the request and token counters under the lock, so concurrent
        threads each see the already-consumed capacity and cannot race past
        the same headroom simultaneously.

        If capacity is exhausted (remaining < reserve threshold), sleeps until
        the reset time then retries — still under the decrement guarantee.
        """
        while True:
            with self._lock:
                now = time.monotonic()
                reserve = _RATE_LIMIT_RESERVE
                sleep_for = 0.0

                if (
                    self._remaining_requests is not None
                    and self._limit_requests is not None
                    and self._remaining_requests < self._limit_requests * reserve
                ):
                    if self._requests_reset_at and self._requests_reset_at > now:
                        sleep_for = max(sleep_for, self._requests_reset_at - now + 0.1)

                token_threshold = max(
                    estimated_tokens,
                    int(self._limit_tokens * reserve) if self._limit_tokens else 0,
                )
                if (
                    token_threshold > 0
                    and self._remaining_tokens is not None
                    and self._remaining_tokens < token_threshold
                ):
                    if self._tokens_reset_at and self._tokens_reset_at > now:
                        sleep_for = max(sleep_for, self._tokens_reset_at - now + 0.1)

                if sleep_for == 0.0:
                    # Capacity is available — pessimistically consume it so the
                    # next thread sees reduced headroom before our response arrives.
                    if self._remaining_requests is not None:
                        self._remaining_requests -= 1
                    if self._remaining_tokens is not None:
                        self._remaining_tokens -= max(estimated_tokens, 0)
                    return

            logging.info("Proactively throttling for model — sleeping %.2fs", sleep_for)
            time.sleep(sleep_for)


_rate_limiters: dict[str, RateLimiter] = {}
_rate_limiters_lock = threading.Lock()


def get_rate_limiter(model: str) -> RateLimiter:
    """Return (or create) the shared RateLimiter for a given model.

    Shared per model so that all OpenAIClient instances calling the same model
    (e.g. ArticleEnricher + ArticleClassifier) contribute to and respect the
    same rate limit state — reflecting that limits are org-level, not per-client.
    """
    with _rate_limiters_lock:
        if model not in _rate_limiters:
            _rate_limiters[model] = RateLimiter()
        return _rate_limiters[model]
