/**
 * Unit tests for CSRF helpers (lib/csrf.ts)
 *
 * Tests cover:
 * - generateCsrfToken: output format, length, uniqueness
 * - validateCsrfToken: matching, mismatching, and edge-case inputs
 */

import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from './csrf';

// ---------------------------------------------------------------------------
// generateCsrfToken
// ---------------------------------------------------------------------------

describe('generateCsrfToken', () => {
  it('returns a 64-character string (32 bytes as hex)', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(64);
  });

  it('returns only lowercase hex characters', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns a different token on each call', () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    const c = generateCsrfToken();
    // Probability of collision is negligibly small (2^-256)
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });
});

// ---------------------------------------------------------------------------
// validateCsrfToken
// ---------------------------------------------------------------------------

describe('validateCsrfToken', () => {
  it('returns true when header and cookie match', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, token)).toBe(true);
  });

  it('returns true for a hardcoded matching pair', () => {
    const t = 'a'.repeat(64);
    expect(validateCsrfToken(t, t)).toBe(true);
  });

  it('returns false when header and cookie differ by one character', () => {
    const token = generateCsrfToken();
    // Flip last hex digit: 'a' → 'b', anything else → 'a'
    const mutated = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(validateCsrfToken(token, mutated)).toBe(false);
  });

  it('returns false when header is null', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(null, token)).toBe(false);
  });

  it('returns false when cookie is undefined', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, undefined)).toBe(false);
  });

  it('returns false when header is an empty string', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken('', token)).toBe(false);
  });

  it('returns false when cookie is an empty string', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, '')).toBe(false);
  });

  it('returns false when both are empty strings', () => {
    expect(validateCsrfToken('', '')).toBe(false);
  });

  it('returns false when values differ in length', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token, token + 'ff')).toBe(false);
    expect(validateCsrfToken(token + 'ff', token)).toBe(false);
  });

  it('returns false when completely different tokens are compared', () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    // Extremely unlikely they match, but handle the one-in-2^256 case
    if (a !== b) {
      expect(validateCsrfToken(a, b)).toBe(false);
    }
  });
});
