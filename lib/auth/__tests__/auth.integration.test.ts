// @vitest-environment node

import { describe, it, expect, beforeEach } from 'vitest';
import { sessionOptions } from '../session';
import { generateCsrfToken, validateCsrfToken } from '../../csrf';
import { config } from '../../../middleware';

/**
 * Integration tests for admin authentication flow and CSRF protection
 * **Validates: Requirements 12.3, 12.8, 12.9**
 */

describe('Admin Auth Integration Tests', () => {
  describe('Session Configuration (session.ts)', () => {
    it('should use "ln-admin-session" as cookie name', () => {
      expect(sessionOptions.cookieName).toBe('ln-admin-session');
    });

    it('should set httpOnly to true for security', () => {
      expect(sessionOptions.cookieOptions!.httpOnly).toBe(true);
    });

    it('should set sameSite to "lax"', () => {
      expect(sessionOptions.cookieOptions!.sameSite).toBe('lax');
    });

    it('should set maxAge to 86400 seconds (24 hours)', () => {
      expect(sessionOptions.cookieOptions!.maxAge).toBe(60 * 60 * 24);
      expect(sessionOptions.cookieOptions!.maxAge).toBe(86400);
    });

    it('should read password from SESSION_SECRET environment variable', () => {
      expect(sessionOptions.password).toBe(process.env.SESSION_SECRET);
    });
  });

  describe('CSRF Token Generation (csrf.ts)', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should never produce the same token twice', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate cryptographically random tokens', () => {
      // Generate multiple tokens and verify they are all unique
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCsrfToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('CSRF Token Validation (csrf.ts)', () => {
    let validToken: string;

    beforeEach(() => {
      validToken = generateCsrfToken();
    });

    it('should return true when header and cookie match', () => {
      const result = validateCsrfToken(validToken, validToken);
      expect(result).toBe(true);
    });

    it('should return false when tokens differ', () => {
      const differentToken = generateCsrfToken();
      const result = validateCsrfToken(validToken, differentToken);
      expect(result).toBe(false);
    });

    it('should return false when X-CSRF-Token header is missing (null)', () => {
      const result = validateCsrfToken(null, validToken);
      expect(result).toBe(false);
    });

    it('should return false when csrf-token cookie is missing (undefined)', () => {
      const result = validateCsrfToken(validToken, undefined);
      expect(result).toBe(false);
    });

    it('should return false for mismatched tokens of equal length', () => {
      // Create two tokens with same length but different content
      const token1 = 'a'.repeat(64);
      const token2 = 'b'.repeat(64);
      expect(token1.length).toBe(token2.length);
      const result = validateCsrfToken(token1, token2);
      expect(result).toBe(false);
    });

    it('should return false when header is empty string', () => {
      const result = validateCsrfToken('', validToken);
      expect(result).toBe(false);
    });

    it('should return false when cookie is empty string', () => {
      const result = validateCsrfToken(validToken, '');
      expect(result).toBe(false);
    });

    it('should return false when both header and cookie are null/undefined', () => {
      const result = validateCsrfToken(null, undefined);
      expect(result).toBe(false);
    });
  });

  describe('Middleware Configuration (middleware.ts)', () => {
    it('should protect /admin/:path* routes', () => {
      expect(config.matcher).toContain('/admin/:path*');
    });

    it('should export matcher as array', () => {
      expect(Array.isArray(config.matcher)).toBe(true);
    });
  });
});
