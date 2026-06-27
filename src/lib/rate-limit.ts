// Simple in-memory rate limiter for API routes
// For multi-instance deployments, replace with Redis-backed implementation

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore: Map<string, RateLimitEntry>;
};

const store: Map<string, RateLimitEntry> =
  globalForRateLimit.rateLimitStore ?? (globalForRateLimit.rateLimitStore = new Map());

/** Default limits per route type */
export const RATE_LIMIT_CONFIGS: Record<string, { windowMs: number; maxRequests: number }> = {
  auth: { windowMs: 60_000, maxRequests: 10 },       // 10 req/min for auth routes
  signIn: { windowMs: 300_000, maxRequests: 5 },     // 5 attempts per 5 min
  api: { windowMs: 60_000, maxRequests: 100 },       // 100 req/min for general API
  write: { windowMs: 60_000, maxRequests: 30 },      // 30 writes per min
  cron: { windowMs: 60_000, maxRequests: 10 },       // 10 cron calls per min
};

/** Get client IP from request headers */
function getClientIP(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/** Generate a rate limit key from IP + path */
function getKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

/** Check and update rate limit, returning rate limit info */
export function checkRateLimit(
  request: Request,
  type: string = 'api'
): { allowed: boolean; remaining: number; resetAt: number; retryAfterMs?: number } {
  const config = RATE_LIMIT_CONFIGS[type] ?? RATE_LIMIT_CONFIGS.api;
  const ip = getClientIP(request);
  const path = new URL(request.url).pathname;
  const key = getKey(ip, path);
  const now = Date.now();

  let entry = store.get(key);

  if (entry && now > entry.resetAt) {
    store.delete(key);
    entry = undefined;
  }

  if (!entry) {
    entry = { count: 0, resetAt: now + config.windowMs };
  }

  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;
  const retryAfterMs = !allowed ? entry.resetAt - now : undefined;

  return { allowed, remaining, resetAt: entry.resetAt, retryAfterMs };
}

/** Cleanup old entries periodically */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt + 60_000) {
      store.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60_000);
}