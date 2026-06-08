import logging
import threading
import time
from collections import deque


class RateLimiter:
    """Thread-safe sliding-window rate limiter for OpenAI TPM/RPM budgets.

    Tracks usage locally rather than relying on ``x-ratelimit-remaining-*``
    headers, which are unreliable under concurrent requests. Headers are still
    read to discover the limit values.

    Args:
        rate_limit_reserve: Safety buffer as a fraction of the stated limit
            (default 0.05 → use 95% of capacity).
        window_seconds: Sliding-window duration in seconds (default 60).
    """

    def __init__(
        self,
        rate_limit_reserve: float = 0.05,
        window_seconds: float = 60.0,
    ) -> None:
        self._rate_limit_reserve = rate_limit_reserve
        self._window_seconds = window_seconds
        self._lock = threading.Lock()
        # Discovered from response headers.
        self._limit_requests: int | None = None
        self._limit_tokens: int | None = None
        # Local sliding-window logs.
        self._token_log: deque[tuple[float, int]] = deque()
        self._request_log: deque[float] = deque()

    # ------------------------------------------------------------------ #
    # Internal helpers — must be called with _lock held                   #
    # ------------------------------------------------------------------ #

    def _evict_expired(self, now: float) -> None:
        cutoff = now - self._window_seconds
        while self._token_log and self._token_log[0][0] < cutoff:
            self._token_log.popleft()
        while self._request_log and self._request_log[0] < cutoff:
            self._request_log.popleft()

    def _next_token_headroom_time(self, need: int) -> float | None:
        """Return the earliest time ``need`` tokens will fit, or None if there is headroom now.

        Must be called with _lock held and after _evict_expired.
        """
        if self._limit_tokens is None:
            return None
        effective_limit = int(self._limit_tokens * (1 - self._rate_limit_reserve))
        used = sum(t for _, t in self._token_log)
        if used + need <= effective_limit:
            return None
        must_free = used + need - effective_limit
        freed = 0
        for ts, toks in self._token_log:
            freed += toks
            if freed >= must_free:
                return ts + self._window_seconds
        return None

    def _compute_sleep_until(self, estimated_tokens: int) -> float | None:
        """Return the earliest wake time needed to satisfy both budgets, or None if clear.

        Must be called with _lock held and after _evict_expired.
        """
        sleep_until: float | None = None

        if self._limit_tokens is not None and estimated_tokens > 0:
            wake = self._next_token_headroom_time(estimated_tokens)
            if wake is not None:
                sleep_until = wake

        if self._limit_requests is not None:
            eff_req = int(self._limit_requests * (1 - self._rate_limit_reserve))
            if len(self._request_log) >= eff_req and self._request_log:
                wake = self._request_log[0] + self._window_seconds
                sleep_until = wake if sleep_until is None else max(sleep_until, wake)

        return sleep_until

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def max_wave_size(self, estimated_tokens_per_request: int) -> int:
        """Return how many requests can safely fire right now. Returns 1 if limits are unknown."""
        with self._lock:
            now = time.monotonic()
            self._evict_expired(now)

            if self._limit_requests is None or self._limit_tokens is None:
                return 1

            eff_req = int(self._limit_requests * (1 - self._rate_limit_reserve))
            eff_tok = int(self._limit_tokens * (1 - self._rate_limit_reserve))

            req_used = len(self._request_log)
            tok_used = sum(t for _, t in self._token_log)

            by_requests = max(0, eff_req - req_used)
            if estimated_tokens_per_request > 0:
                by_tokens = max(0, eff_tok - tok_used) // estimated_tokens_per_request
                return max(1, min(by_requests, by_tokens))

            return max(1, by_requests)

    def update_from_headers(self, headers) -> None:
        """Update TPM/RPM limits from response headers. Ignores ``x-ratelimit-remaining-*``."""
        with self._lock:
            if (v := headers.get("x-ratelimit-limit-requests")) is not None:
                self._limit_requests = int(v)
            if (v := headers.get("x-ratelimit-limit-tokens")) is not None:
                self._limit_tokens = int(v)

    def acquire(self, estimated_tokens: int = 0) -> None:
        """Block until budget permits, then record consumption for one request."""
        while True:
            with self._lock:
                now = time.monotonic()
                self._evict_expired(now)
                sleep_until = self._compute_sleep_until(estimated_tokens)

                if sleep_until is None:
                    # Capacity available — record consumption now.
                    self._token_log.append((now, max(estimated_tokens, 0)))
                    self._request_log.append(now)
                    return

            delay = sleep_until - time.monotonic() + 0.05
            if delay > 0:
                logging.info(
                    "Rate limit: sleeping %.2fs to free token/request budget", delay
                )
                time.sleep(delay)


_rate_limiters: dict[str, RateLimiter] = {}
_rate_limiters_lock = threading.Lock()


def get_rate_limiter(model: str) -> RateLimiter:
    """Return the shared RateLimiter for a model, creating it if needed.

    Per-model singleton so all clients share the same org-level budget.
    """
    with _rate_limiters_lock:
        if model not in _rate_limiters:
            _rate_limiters[model] = RateLimiter()
        return _rate_limiters[model]
