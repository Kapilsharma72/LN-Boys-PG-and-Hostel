/**
 * Property-based tests for the `preferredDate` field in LeadSchema.
 *
 * **Validates: Requirements 9.2**
 *
 * Property 11: Preferred-date validation rejects past dates (and accepts
 * today or any future date). The field is optional — absent values always pass.
 *
 * The schema uses `z.coerce.date()` with a `.refine()` that compares the
 * UTC date-portion of the supplied date against the UTC start of today,
 * so the comparison is always timezone-safe.
 *
 * Uses fast-check to generate dates across the relevant temporal space and
 * assert the validator behaves correctly for every generated input.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { LeadSchema } from '../lead';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the start of today (midnight) in UTC as a Date object.
 * Mirrors the implementation inside lead.ts.
 */
function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Returns today + `n` days (at midnight UTC). n may be negative. */
function addDays(base: Date, n: number): Date {
  return new Date(base.getTime() + n * 24 * 60 * 60 * 1000);
}

/**
 * A minimal valid LeadSchema payload that omits `preferredDate` so tests
 * can inject arbitrary date values without noise from other fields.
 */
const VALID_BASE = {
  name: 'Test User',
  mobile: '9876543210',
  whatsappOptIn: false,
  intent: 'visit' as const,
  branchId: 'branch-test-1',
  source: 'enquiry-form' as const,
};

// Precompute stable boundaries so all tests in a single run use the same "today".
const TODAY_UTC = startOfTodayUtc();
const YESTERDAY_UTC = addDays(TODAY_UTC, -1);
const TOMORROW_UTC = addDays(TODAY_UTC, 1);
const TEN_YEARS_FUTURE = addDays(TODAY_UTC, 365 * 10);

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a Date that is strictly in the past relative to UTC today.
 * We pick any date from 1970-01-01 up to (but not including) yesterday's
 * midnight, ensuring it always represents a date-portion earlier than today.
 *
 * The upper bound is (YESTERDAY_UTC - 1 ms) so that the generated date
 * cannot accidentally land on today regardless of time-of-day shifts during
 * test execution.
 */
const pastDateArb = fc.date({
  min: new Date(0),                               // 1970-01-01 UTC
  max: new Date(YESTERDAY_UTC.getTime() - 1),     // just before yesterday midnight
  noInvalidDate: true,
});

/**
 * Generates a Date from tomorrow midnight up to 10 years in the future.
 * Any date here must be accepted by the validator.
 *
 * We filter out NaN / invalid dates that fc.date() can occasionally produce
 * (they are unrelated to the date-range property under test and would be
 * correctly rejected by the schema for a different reason).
 */
const futureDateArb = fc
  .date({
    min: TOMORROW_UTC,
    max: TEN_YEARS_FUTURE,
    noInvalidDate: true,
  });

// ---------------------------------------------------------------------------
// Property 11a: Past dates are always rejected
// ---------------------------------------------------------------------------

describe('Property 11 — past dates always rejected', () => {
  it('rejects any date whose UTC date-portion is before today', () => {
    fc.assert(
      fc.property(pastDateArb, (date) => {
        const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: date });
        expect(result.success).toBe(false);
      }),
      { numRuns: 1000 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11b: Today is always accepted
// ---------------------------------------------------------------------------

describe('Property 11 — today always accepted', () => {
  it('accepts exactly today (midnight UTC)', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: TODAY_UTC });
    expect(result.success).toBe(true);
  });

  it('accepts today even when submitted with a non-midnight time component', () => {
    // Set time to 23:59:59.999 UTC on today's date — still the same date-portion.
    const endOfToday = new Date(
      Date.UTC(
        TODAY_UTC.getUTCFullYear(),
        TODAY_UTC.getUTCMonth(),
        TODAY_UTC.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: endOfToday });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 11c: Future dates are always accepted
// ---------------------------------------------------------------------------

describe('Property 11 — future dates always accepted', () => {
  it('accepts any date whose UTC date-portion is strictly after today', () => {
    fc.assert(
      fc.property(futureDateArb, (date) => {
        const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: date });
        expect(result.success).toBe(true);
      }),
      { numRuns: 1000 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11d: Absent / undefined is accepted (field is optional)
// ---------------------------------------------------------------------------

describe('Property 11 — absent preferredDate always accepted', () => {
  it('passes when preferredDate is not provided', () => {
    const result = LeadSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it('passes when preferredDate is explicitly undefined', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: undefined });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 11e: Yesterday specifically rejected (example-based boundary check)
// ---------------------------------------------------------------------------

describe('Property 11 — yesterday always rejected', () => {
  it('rejects yesterday (midnight UTC)', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: YESTERDAY_UTC });
    expect(result.success).toBe(false);
  });

  it('rejects yesterday as an ISO date string', () => {
    const yesterdayIso = YESTERDAY_UTC.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: yesterdayIso });
    expect(result.success).toBe(false);
  });
});
