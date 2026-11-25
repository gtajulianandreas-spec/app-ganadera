import { query } from './db.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const MAX_MEMORY_ENTRIES = 1000;
const memoryFallback = new Map<string, { attempts: number; windowStart: number; blockedUntil: number }>();

export function checkInMemoryRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
  blockSeconds: number,
  nowMs: number = Date.now()
): RateLimitResult {
  if (memoryFallback.size >= MAX_MEMORY_ENTRIES && !memoryFallback.has(key)) {
    const oldestKey = memoryFallback.keys().next().value;
    if (oldestKey) memoryFallback.delete(oldestKey);
  }

  const existing = memoryFallback.get(key);
  if (existing && existing.blockedUntil > nowMs) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.blockedUntil - nowMs) / 1000),
    };
  }

  if (!existing || nowMs - existing.windowStart > windowSeconds * 1000) {
    memoryFallback.set(key, { attempts: 1, windowStart: nowMs, blockedUntil: 0 });
    return { allowed: true, remaining: Math.max(0, maxAttempts - 1), retryAfterSeconds: 0 };
  }

  const nextAttempts = existing.attempts + 1;
  if (nextAttempts > maxAttempts) {
    const blockedUntil = nowMs + blockSeconds * 1000;
    memoryFallback.set(key, { ...existing, attempts: nextAttempts, blockedUntil });
    return { allowed: false, remaining: 0, retryAfterSeconds: blockSeconds };
  }

  memoryFallback.set(key, { ...existing, attempts: nextAttempts });
  return { allowed: true, remaining: Math.max(0, maxAttempts - nextAttempts), retryAfterSeconds: 0 };
}

/**
 * Atomic PostgreSQL rate limiter (no SELECT-then-UPDATE TOCTOU race condition).
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 10,
  windowSeconds: number = 300,
  blockSeconds: number = 900
): Promise<RateLimitResult> {
  try {
    const res = await query<{ attempts: number; blocked_until: Date | null }>(
      `INSERT INTO rate_limits (key, attempts, window_start, blocked_until)
       VALUES ($1, 1, NOW(), NULL)
       ON CONFLICT (key) DO UPDATE SET
         attempts = CASE
           WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > NOW() THEN rate_limits.attempts
           WHEN rate_limits.window_start < NOW() - ($2 || ' seconds')::interval THEN 1
           ELSE rate_limits.attempts + 1
         END,
         window_start = CASE
           WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > NOW() THEN rate_limits.window_start
           WHEN rate_limits.window_start < NOW() - ($2 || ' seconds')::interval THEN NOW()
           ELSE rate_limits.window_start
         END,
         blocked_until = CASE
           WHEN rate_limits.blocked_until IS NOT NULL AND rate_limits.blocked_until > NOW() THEN rate_limits.blocked_until
           WHEN rate_limits.window_start >= NOW() - ($2 || ' seconds')::interval AND rate_limits.attempts + 1 > $3
             THEN NOW() + ($4 || ' seconds')::interval
           ELSE NULL
         END
       RETURNING attempts, blocked_until`,
      [key, windowSeconds, maxAttempts, blockSeconds]
    );

    const row = res.rows[0];
    if (row?.blocked_until && new Date(row.blocked_until) > new Date()) {
      const retryAfterSeconds = Math.ceil((new Date(row.blocked_until).getTime() - Date.now()) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - (row?.attempts || 1)),
      retryAfterSeconds: 0,
    };
  } catch {
    return checkInMemoryRateLimit(key, maxAttempts, windowSeconds, blockSeconds);
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  memoryFallback.delete(key);
  try {
    await query(`DELETE FROM rate_limits WHERE key = $1`, [key]);
  } catch {
    // ignore in offline test mode
  }
}
