import logging
import threading
import time
from collections import deque
from dataclasses import dataclass, field

# Fraction of the limit kept as a safety buffer so we never ride the absolute edge.
# e.g. 0.05 means we treat the effective limit as 95% of the stated value.
_RATE_LIMIT_RESERVE: float = 0.05

# OpenAI TPM/RPM windows are 60 seconds.
_WINDOW_SECONDS: float = 60.0


@dataclass
class RateLimiter:
    """Thread-safe, proactive rate limiter using a local sliding-window budget.

    Rather than relying on ``x-ratelimit-remaining-*`` headers (which reflect
    OpenAI's per-request snapshot and are unreliable when many requests are
    in-flight simultaneously), we maintain our own deque of
    ``(monotonic_timestamp, tokens)`` entries covering the past 60 seconds.

    This means we always have an accurate picture of how much of the current
    TPM/RPM window we have consumed — regardless of how many concurrent
    requests are in-flight or in what order their responses arrive.

    Response headers are still read, but only to discover the limit values
    (TPM / RPM).
    """

    _lock: threading.Lock = field(
        default_factory=threading.Lock, init=False, repr=False
    )
    # Discovered from response headers.
    _limit_requests: int | None = field(default=None, init=False)
    _limit_tokens: int | None = field(default=None, init=False)
    # Local sliding-window logs.
    _token_log: deque[tuple[float, int]] = field(
        default_factory=deque, init=False, repr=False
    )
    _request_log: deque[float] = field(default_factory=deque, init=False, repr=False)

    # ------------------------------------------------------------------ #
    # Internal helpers — must be called with _lock held                   #
    # ------------------------------------------------------------------ #

    def _evict_expired(self, now: float) -> None:
        cutoff = now - _WINDOW_SECONDS
        while self._token_log and self._token_log[0][0] < cutoff:
            self._token_log.popleft()
        while self._request_log and self._request_log[0] < cutoff:
            self._request_log.popleft()

    def _next_token_headroom_time(self, need: int) -> float | None:
        """Earliest monotonic time at which ``need`` additional tokens will fit.

        Returns None if there is already enough headroom right now.
        Walks the token log oldest-first and accumulates until expiring those
        entries frees sufficient capacity. Must be called with _lock held and
        after _evict_expired.
        """
        if self._limit_tokens is None:
            return None
        effective_limit = int(self._limit_tokens * (1 - _RATE_LIMIT_RESERVE))
        used = sum(t for _, t in self._token_log)
        if used + need <= effective_limit:
            return None
        must_free = used + need - effective_limit
        freed = 0
        for ts, toks in self._token_log:
            freed += toks
            if freed >= must_free:
                return ts + _WINDOW_SECONDS
        return None

    def _compute_sleep_until(self, estimated_tokens: int) -> float | None:
        """Return the earliest wake time needed to satisfy budgets, or None if clear.

        Pure read — does not mutate any state. Must be called with _lock held
        and after _evict_expired.
        """
        sleep_until: float | None = None

        if self._limit_tokens is not None and estimated_tokens > 0:
            wake = self._next_token_headroom_time(estimated_tokens)
            if wake is not None:
                sleep_until = wake

        if self._limit_requests is not None:
            eff_req = int(self._limit_requests * (1 - _RATE_LIMIT_RESERVE))
            if len(self._request_log) >= eff_req and self._request_log:
                wake = self._request_log[0] + _WINDOW_SECONDS
                sleep_until = wake if sleep_until is None else max(sleep_until, wake)

        return sleep_until

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def max_wave_size(self, estimated_tokens_per_request: int) -> int:
        """Return the maximum number of requests that can safely fire right now.

        Computed entirely from the local sliding-window usage log.
        Returns 1 when no limit is known yet (conservative default).
        """
        with self._lock:
            now = time.monotonic()
            self._evict_expired(now)

            if self._limit_requests is None or self._limit_tokens is None:
                return 1

            eff_req = int(self._limit_requests * (1 - _RATE_LIMIT_RESERVE))
            eff_tok = int(self._limit_tokens * (1 - _RATE_LIMIT_RESERVE))

            req_used = len(self._request_log)
            tok_used = sum(t for _, t in self._token_log)

            by_requests = max(0, eff_req - req_used)
            if estimated_tokens_per_request > 0:
                by_tokens = max(0, eff_tok - tok_used) // estimated_tokens_per_request
                return max(1, min(by_requests, by_tokens))

            return max(1, by_requests)

    def update_from_headers(self, headers) -> None:
        """Learn limit values from response headers.

        We intentionally ignore ``x-ratelimit-remaining-*`` — capacity
        tracking is handled by the local usage log.
        """
        with self._lock:
            if (v := headers.get("x-ratelimit-limit-requests")) is not None:
                self._limit_requests = int(v)
            if (v := headers.get("x-ratelimit-limit-tokens")) is not None:
                self._limit_tokens = int(v)

    def acquire(self, estimated_tokens: int = 0) -> None:
        """Reserve capacity for one request, blocking until budget permits.

        Records consumption in the local usage log immediately so that
        concurrent threads each see reduced headroom before their own HTTP
        request fires.
        """
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
    """Return (or create) the shared RateLimiter for a given model.

    Shared per model so that all OpenAIClient instances calling the same model
    (e.g. ArticleEnricher + ArticleClassifier) contribute to and respect the
    same rate limit state — reflecting that limits are org-level, not per-client.
    """
    with _rate_limiters_lock:
        if model not in _rate_limiters:
            _rate_limiters[model] = RateLimiter()
        return _rate_limiters[model]
