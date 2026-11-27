// Lightweight sliding-window rate limiter keyed by authenticated user ID or IP

const buckets = new Map();

export function createRateLimiter({ windowMs = 60_000, maxRequests = 30 } = {}) {
  return function rateLimit(req, res, next) {
    const key = req.user?._id?.toString() || req.ip || 'anonymous';
    const now = Date.now();
    const cutoff = now - windowMs;

    const history = (buckets.get(key) || []).filter((ts) => ts > cutoff);
    if (history.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many interview requests. Please pause a moment before trying again.',
      });
    }

    history.push(now);
    buckets.set(key, history);
    next();
  };
}
