/**
 * CSRF protection helpers — double-submit cookie pattern
 *
 * Design (Requirement 12.8):
 * 1. On admin login success the server generates a random 32-byte hex token and
 *    sets it as a non-HTTP-only cookie named `csrf-token`.
 * 2. Every state-mutating admin request must include the `X-CSRF-Token` header
 *    whose value matches the `csrf-token` cookie.
 * 3. Middleware compares header vs. cookie; mismatch returns HTTP 403.
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically random CSRF token.
 * Returns a 64-character lowercase hex string (32 bytes → 64 hex chars).
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a CSRF token by comparing the request header value against the
 * cookie value using a constant-time comparison to prevent timing attacks.
 *
 * @param header - Value of the `X-CSRF-Token` request header (or null if absent)
 * @param cookie - Value of the `csrf-token` cookie (or undefined if absent)
 * @returns `true` only when both values are non-empty strings and match exactly
 */
export function validateCsrfToken(
  header: string | null,
  cookie: string | undefined,
): boolean {
  // Both values must be present and non-empty
  if (!header || !cookie) return false;

  // Values must have the same byte length for timingSafeEqual
  if (header.length !== cookie.length) return false;

  try {
    const headerBuf = Buffer.from(header, 'utf8');
    const cookieBuf = Buffer.from(cookie, 'utf8');
    return crypto.timingSafeEqual(headerBuf, cookieBuf);
  } catch {
    return false;
  }
}
