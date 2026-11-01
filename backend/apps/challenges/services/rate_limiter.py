import time
from contextlib import contextmanager
from django.core.cache import cache


class AIRateLimiter:
    """
    Sliding window rate limiter to protect Gemini AI quotas and prevent excessive billing.
    Uses Django's cache framework for fast in-memory lookups.
    """
    @staticmethod
    def check_and_consume(user_id: str, max_requests: int = 6, window_seconds: int = 60) -> tuple[bool, int]:
        """
        Returns (is_allowed, wait_seconds_or_remaining).
        If allowed: (True, remaining_calls)
        If throttled: (False, seconds_until_retry)
        """
        cache_key = f"ai_throttle_{user_id}"
        now = time.time()
        timestamps = cache.get(cache_key, [])
        
        # Filter out timestamps outside the sliding window
        valid_timestamps = [t for t in timestamps if now - t < window_seconds]
        
        if len(valid_timestamps) >= max_requests:
            oldest = valid_timestamps[0]
            retry_after = int(window_seconds - (now - oldest)) + 1
            return False, max(1, retry_after)
            
        valid_timestamps.append(now)
        cache.set(cache_key, valid_timestamps, timeout=window_seconds + 5)
        remaining = max_requests - len(valid_timestamps)
        return True, remaining


@contextmanager
def session_ai_lock(session_id: str, timeout_seconds: int = 15):
    """
    Mutex lock per session to prevent race conditions and duplicate AI generation
    when users trigger rapid concurrent requests.
    """
    lock_key = f"session_ai_lock_{session_id}"
    acquired = cache.add(lock_key, "locked", timeout=timeout_seconds)
    try:
        yield acquired
    finally:
        if acquired:
            cache.delete(lock_key)

