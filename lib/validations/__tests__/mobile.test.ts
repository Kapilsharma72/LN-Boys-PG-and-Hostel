/**
 * Property-based tests for the `mobile` field in LeadSchema.
 *
 * **Validates: Requirements 6.2, 9.2**
 *
 * Property 10: Mobile number validation accepts only 10-digit numbers beginning with 6–9.
 *
 * The regex enforced by LeadSchema is: ^[6-9]\d{9}$
 *
 * Uses fast-check to generate inputs across the full space and assert
 * the validator behaves correctly for every possible input.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LeadSchema } from '../lead';

// ---------------------------------------------------------------------------
// Arbitrary helpers
// ---------------------------------------------------------------------------

/** Digits 0–9 as individual characters. */
const DIGIT_CHARS = '0123456789'.split('');

/** First digits that are valid for Indian mobile numbers (6, 7, 8, 9). */
const VALID_FIRST_DIGITS = ['6', '7', '8', '9'];

/** First digits that are invalid for Indian mobile numbers (0–5). */
const INVALID_FIRST_DIGITS = ['0', '1', '2', '3', '4', '5'];

/**
 * Generates a valid 10-digit mobile string: first digit is 6–9,
 * followed by exactly 9 more digits.
 */
const validMobileArb = fc
  .tuple(
    fc.constantFrom(...VALID_FIRST_DIGITS),
    fc.stringMatching(/^\d{9}$/),
  )
  .map(([first, rest]) => first + rest);

/**
 * Generates a 10-digit string whose first digit is 0–5 (always invalid).
 */
const invalidFirstDigitMobileArb = fc
  .tuple(
    fc.constantFrom(...INVALID_FIRST_DIGITS),
    fc.stringMatching(/^\d{9}$/),
  )
  .map(([first, rest]) => first + rest);

/**
 * Generates a digit-only string that is too short (1–9 digits).
 */
const tooShortMobileArb = fc
  .integer({ min: 1, max: 9 })
  .chain((len) =>
    fc.array(fc.constantFrom(...DIGIT_CHARS), { minLength: len, maxLength: len })
      .map((chars) => chars.join('')),
  );

/**
 * Generates a digit-only string that is too long (11+ digits, capped at 20).
 */
const tooLongMobileArb = fc
  .integer({ min: 11, max: 20 })
  .chain((len) =>
    fc.array(fc.constantFrom(...DIGIT_CHARS), { minLength: len, maxLength: len })
      .map((chars) => chars.join('')),
  );

/**
 * Generates a string that contains at least one non-digit character
 * (letter, space, or special char), making it always invalid.
 */
const NON_DIGIT_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ !@#$%^&*+-'.split('');

const nonDigitMobileArb = fc
  .tuple(
    fc.constantFrom(...NON_DIGIT_CHARS),              // guaranteed non-digit
    fc.string({ maxLength: 14 }),                      // surrounding noise
    fc.string({ maxLength: 14 }),
  )
  .map(([nonDigit, pre, suf]) => pre + nonDigit + suf);

// ---------------------------------------------------------------------------
// Property 10a: Valid 10-digit mobiles starting with 6–9 are always accepted
// ---------------------------------------------------------------------------

describe('Property 10 — valid mobiles always accepted', () => {
  it('accepts any 10-digit string whose first digit is 6, 7, 8, or 9', () => {
    fc.assert(
      fc.property(validMobileArb, (mobile) => {
        expect(LeadSchema.shape.mobile.safeParse(mobile).success).toBe(true);
      }),
      { numRuns: 1000 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10b: 10-digit numbers starting with 0–5 are always rejected
// ---------------------------------------------------------------------------

describe('Property 10 — numbers starting with 0–5 rejected', () => {
  it('rejects any 10-digit string whose first digit is 0, 1, 2, 3, 4, or 5', () => {
    fc.assert(
      fc.property(invalidFirstDigitMobileArb, (mobile) => {
        expect(LeadSchema.shape.mobile.safeParse(mobile).success).toBe(false);
      }),
      { numRuns: 1000 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10c: Strings shorter than 10 digits are always rejected
// ---------------------------------------------------------------------------

describe('Property 10 — too short strings rejected', () => {
  it('rejects any digit string of length 1–9', () => {
    fc.assert(
      fc.property(tooShortMobileArb, (mobile) => {
        expect(LeadSchema.shape.mobile.safeParse(mobile).success).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10d: Strings longer than 10 digits are always rejected
// ---------------------------------------------------------------------------

describe('Property 10 — too long strings rejected', () => {
  it('rejects any digit string of length 11 or more', () => {
    fc.assert(
      fc.property(tooLongMobileArb, (mobile) => {
        expect(LeadSchema.shape.mobile.safeParse(mobile).success).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10e: Strings containing non-digit characters are always rejected
// ---------------------------------------------------------------------------

describe('Property 10 — non-digit characters rejected', () => {
  it('rejects any string that contains at least one letter, space, or special character', () => {
    fc.assert(
      fc.property(nonDigitMobileArb, (mobile) => {
        expect(LeadSchema.shape.mobile.safeParse(mobile).success).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10f: Boundary — exactly 10 digits starting with 6–9 is the only valid length
// ---------------------------------------------------------------------------

describe('Property 10 — length boundary: 9-digit and 11-digit versions of valid mobiles are rejected', () => {
  /**
   * Take a valid 10-digit mobile and produce the 9-digit version (drop last char)
   * and the 11-digit version (append one extra digit).
   */
  const boundaryArb = fc
    .tuple(validMobileArb, fc.constantFrom(...DIGIT_CHARS))
    .map(([mobile, extraDigit]) => ({
      tooShort: mobile.slice(0, 9),   // 9 digits
      tooLong: mobile + extraDigit,   // 11 digits
    }));

  it('rejects the 9-digit prefix of a valid 10-digit mobile', () => {
    fc.assert(
      fc.property(boundaryArb, ({ tooShort }) => {
        expect(LeadSchema.shape.mobile.safeParse(tooShort).success).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('rejects the 11-digit extension of a valid 10-digit mobile', () => {
    fc.assert(
      fc.property(boundaryArb, ({ tooLong }) => {
        expect(LeadSchema.shape.mobile.safeParse(tooLong).success).toBe(false);
      }),
      { numRuns: 500 },
    );
  });
});

// ---------------------------------------------------------------------------
// Example-based sanity checks
// ---------------------------------------------------------------------------

describe('LeadSchema mobile — example-based sanity checks', () => {
  it('accepts "9876543210"', () => {
    expect(LeadSchema.shape.mobile.safeParse('9876543210').success).toBe(true);
  });

  it('accepts "6000000000" (first valid first-digit, all zeros after)', () => {
    expect(LeadSchema.shape.mobile.safeParse('6000000000').success).toBe(true);
  });

  it('accepts "9999999999" (all nines)', () => {
    expect(LeadSchema.shape.mobile.safeParse('9999999999').success).toBe(true);
  });

  it('rejects "5876543210" (starts with 5)', () => {
    expect(LeadSchema.shape.mobile.safeParse('5876543210').success).toBe(false);
  });

  it('rejects "0876543210" (starts with 0)', () => {
    expect(LeadSchema.shape.mobile.safeParse('0876543210').success).toBe(false);
  });

  it('rejects "987654321" (only 9 digits)', () => {
    expect(LeadSchema.shape.mobile.safeParse('987654321').success).toBe(false);
  });

  it('rejects "98765432101" (11 digits)', () => {
    expect(LeadSchema.shape.mobile.safeParse('98765432101').success).toBe(false);
  });

  it('rejects "" (empty string)', () => {
    expect(LeadSchema.shape.mobile.safeParse('').success).toBe(false);
  });

  it('rejects "987654321a" (letter in number)', () => {
    expect(LeadSchema.shape.mobile.safeParse('987654321a').success).toBe(false);
  });

  it('rejects "9876 43210" (space in number)', () => {
    expect(LeadSchema.shape.mobile.safeParse('9876 43210').success).toBe(false);
  });

  it('rejects "+919876543210" (international prefix)', () => {
    expect(LeadSchema.shape.mobile.safeParse('+919876543210').success).toBe(false);
  });
});
