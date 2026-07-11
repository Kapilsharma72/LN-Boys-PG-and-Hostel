/**
 * Property-based tests for validateBranchId() — branch slug validator.
 *
 * **Validates: Requirements 1.8**
 *
 * Property 1: Branch slug validation rejects non-URL-safe strings.
 *
 * Uses fast-check to generate inputs across the full space and assert
 * the validator behaves correctly for every possible input.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateBranchId } from '../branch';

// ---------------------------------------------------------------------------
// Arbitrary helpers
// ---------------------------------------------------------------------------

/** Generates a single lowercase alphanumeric segment of length 1–40. */
const segmentArb = fc
  .stringMatching(/^[a-z0-9]+$/)
  .filter((s) => s.length >= 1 && s.length <= 40);

/**
 * Generates a valid slug: one or more segments joined by single hyphens,
 * total length between 3 and 80 characters.
 */
const validSlugArb = fc
  .array(segmentArb, { minLength: 1, maxLength: 10 })
  .map((parts) => parts.join('-'))
  .filter((s) => s.length >= 3 && s.length <= 80);

// ---------------------------------------------------------------------------
// Property 1a: Valid slugs are always accepted
// ---------------------------------------------------------------------------

describe('Property 1 — valid slugs always accepted', () => {
  it('accepts any string matching ^[a-z0-9]+(-[a-z0-9]+)*$ with length 3–80', () => {
    fc.assert(
      fc.property(validSlugArb, (slug) => {
        expect(validateBranchId(slug)).toBe(true);
      }),
      { numRuns: 1000 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1b: Uppercase letters are rejected
// ---------------------------------------------------------------------------

describe('Property 1 — uppercase letters rejected', () => {
  /**
   * Build a string that definitely contains at least one uppercase letter:
   * take a valid slug and replace one character at a random position with
   * an uppercase ASCII letter (A–Z). This guarantees the resulting string
   * always has an uppercase letter regardless of the original content.
   */
  const UPPERCASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const slugWithUppercaseArb = fc
    .tuple(
      validSlugArb,
      fc.constantFrom(...UPPERCASE_LETTERS.split('')),
      fc.integer({ min: 0, max: 79 }),
    )
    .map(([slug, upper, posRaw]) => {
      // Insert the uppercase letter at a valid position within the slug
      const pos = posRaw % slug.length;
      return slug.slice(0, pos) + upper + slug.slice(pos + 1);
    });

  it('rejects any slug containing at least one uppercase letter', () => {
    fc.assert(
      fc.property(slugWithUppercaseArb, (slug) => {
        expect(validateBranchId(slug)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1c: Spaces are rejected
// ---------------------------------------------------------------------------

describe('Property 1 — spaces rejected', () => {
  /**
   * Insert a space at a random position inside a printable string.
   * We guarantee at least one space so the validator must reject.
   */
  const stringWithSpaceArb = fc
    .tuple(
      fc.stringMatching(/^[a-z0-9]+$/), // prefix (no space)
      fc.stringMatching(/^[a-z0-9]+$/), // suffix (no space)
    )
    .map(([pre, suf]) => pre + ' ' + suf);

  it('rejects any string that contains a space character', () => {
    fc.assert(
      fc.property(stringWithSpaceArb, (s) => {
        expect(validateBranchId(s)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1d: Special characters (underscore, dot, slash, @, etc.) rejected
// ---------------------------------------------------------------------------

describe('Property 1 — special characters rejected', () => {
  const SPECIAL_CHARS = ['_', '.', '/', '@', '!', '#', '$', '%', '&', '*', '?'];

  const stringWithSpecialCharArb = fc
    .tuple(
      fc.constantFrom(...SPECIAL_CHARS),
      fc.stringMatching(/^[a-z0-9]*$/),
      fc.stringMatching(/^[a-z0-9]*$/),
    )
    .map(([special, pre, suf]) => pre + special + suf);

  it('rejects any string that contains a special character', () => {
    fc.assert(
      fc.property(stringWithSpecialCharArb, (s) => {
        expect(validateBranchId(s)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1e: Too-short strings (under 3 chars) are rejected
// ---------------------------------------------------------------------------

describe('Property 1 — too short strings rejected', () => {
  /** Generates any string of length 0, 1, or 2 (could be anything). */
  const tooShortArb = fc.string({ maxLength: 2 });

  it('rejects any string with fewer than 3 characters', () => {
    fc.assert(
      fc.property(tooShortArb, (s) => {
        expect(validateBranchId(s)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1f: Too-long strings (over 80 chars) are rejected
// ---------------------------------------------------------------------------

describe('Property 1 — too long strings rejected', () => {
  /** Generates a valid-looking slug segment padded to more than 80 chars. */
  const tooLongArb = fc
    .stringMatching(/^[a-z0-9]+$/)
    .filter((s) => s.length >= 1)
    .map((s) => {
      // Repeat until we exceed 80 chars
      let result = s;
      while (result.length <= 80) result += s;
      return result.slice(0, 81 + (s.length % 20)); // ensure > 80
    });

  it('rejects any string longer than 80 characters', () => {
    fc.assert(
      fc.property(tooLongArb, (s) => {
        expect(validateBranchId(s)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1g: Double hyphens are rejected
// ---------------------------------------------------------------------------

describe('Property 1 — double hyphens rejected', () => {
  /**
   * Build strings that contain "--" somewhere inside by joining two
   * valid segments with "--" instead of "-".
   */
  const doubleHyphenArb = fc
    .tuple(segmentArb, segmentArb)
    .map(([a, b]) => `${a}--${b}`);

  it('rejects any string that contains "--"', () => {
    fc.assert(
      fc.property(doubleHyphenArb, (s) => {
        expect(validateBranchId(s)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1h: Leading or trailing hyphens are rejected
// ---------------------------------------------------------------------------

describe('Property 1 — leading/trailing hyphens rejected', () => {
  const leadingHyphenArb = segmentArb.map((s) => '-' + s);
  const trailingHyphenArb = segmentArb.map((s) => s + '-');

  it('rejects any string that starts with a hyphen', () => {
    fc.assert(
      fc.property(leadingHyphenArb, (s) => {
        expect(validateBranchId(s)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('rejects any string that ends with a hyphen', () => {
    fc.assert(
      fc.property(trailingHyphenArb, (s) => {
        expect(validateBranchId(s)).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Example-based tests — sanity checks for quick diagnosis on failure
// ---------------------------------------------------------------------------

describe('validateBranchId() — example-based sanity checks', () => {
  it('accepts "ln-vidhani"', () => {
    expect(validateBranchId('ln-vidhani')).toBe(true);
  });

  it('accepts "branch1"', () => {
    expect(validateBranchId('branch1')).toBe(true);
  });

  it('accepts "abc" (minimum length)', () => {
    expect(validateBranchId('abc')).toBe(true);
  });

  it('accepts an 80-character slug', () => {
    const slug = 'ln' + '-x'.repeat(39); // 2 + 78 = 80 chars
    expect(slug.length).toBe(80);
    expect(validateBranchId(slug)).toBe(true);
  });

  it('rejects "" (empty string)', () => {
    expect(validateBranchId('')).toBe(false);
  });

  it('rejects "ab" (2 chars)', () => {
    expect(validateBranchId('ab')).toBe(false);
  });

  it('rejects "LN-vidhani" (uppercase)', () => {
    expect(validateBranchId('LN-vidhani')).toBe(false);
  });

  it('rejects "ln vidhani" (space)', () => {
    expect(validateBranchId('ln vidhani')).toBe(false);
  });

  it('rejects "ln_vidhani" (underscore)', () => {
    expect(validateBranchId('ln_vidhani')).toBe(false);
  });

  it('rejects "ln.vidhani" (dot)', () => {
    expect(validateBranchId('ln.vidhani')).toBe(false);
  });

  it('rejects "ln--vidhani" (double hyphen)', () => {
    expect(validateBranchId('ln--vidhani')).toBe(false);
  });

  it('rejects "-ln-vidhani" (leading hyphen)', () => {
    expect(validateBranchId('-ln-vidhani')).toBe(false);
  });

  it('rejects "ln-vidhani-" (trailing hyphen)', () => {
    expect(validateBranchId('ln-vidhani-')).toBe(false);
  });

  it('rejects a string of 81 characters', () => {
    expect(validateBranchId('a'.repeat(81))).toBe(false);
  });
});
