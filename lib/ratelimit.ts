/**
 * Rate limiting configuration using @upstash/ratelimit
 *
 * Design (Requirement 13.5):
 * - Sliding-window algorithm: 5 requests per IP per 10-minute window
 * - Backed by Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars)
 * - Used on POST /api/leads to prevent spam submissions
 * - On limit exceeded, the handler returns HTTP 429 with Retry-After header
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Upstash sliding-window rate limiter instance.
 * Allows 5 requests per IP address within any rolling 10-minute window.
 */
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: false,
});

/**
 * Result shape returned by checkRateLimit.
 * Extends the native Ratelimit result with a computed retryAfter value.
 */
export interface RateLimitResult {
  /** Whether the request is within the allowed limit */
  success: boolean;
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the current window resets */
  reset: number;
  /** Seconds until the window resets (0 when not rate-limited) */
  retryAfter: number;
}

/**
 * Check whether the given IP address is within the rate limit.
 *
 * @param ip - The client IP address used as the rate-limit key
 * @returns RateLimitResult containing success flag, window metadata, and retryAfter seconds
 *
 * @example
 * const result = await checkRateLimit(clientIp);
 * if (!result.success) {
 *   return new Response(null, {
 *     status: 429,
 *     headers: { 'Retry-After': String(result.retryAfter) },
 *   });
 * }
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const result = await ratelimit.limit(ip);
  const { success, limit, remaining, reset } = result;

  // Compute how many seconds remain until the window resets.
  // Math.ceil ensures we round up so clients don't retry too early.
  const retryAfter = success ? 0 : Math.ceil((reset - Date.now()) / 1000);

  return { success, limit, remaining, reset, retryAfter };
}
