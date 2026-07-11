// @vitest-environment node
/**
 * Property-based tests for TestimonialsSection filtering and ordering logic.
 *
 * **Validates: Requirements 3.5, 12.7**
 *
 * Property 8: Only approved testimonials appear on the branch detail page,
 * at most 10, ordered by date descending.
 *
 * Sub-properties tested:
 *   8a — Approved-only filtering: result never contains a testimonial with approved === false
 *   8b — At-most-10 limit: result length is always ≤ 10
 *   8c — Date ordering: consecutive pairs satisfy result[i].date >= result[i+1].date
 *   8d — Completeness: if N approved testimonials exist (N ≤ 10), result length === N
 *   8e — Exactly 10 when more available: if > 10 approved testimonials, result length === 10
 *   8f — Empty input → empty output
 *   8g — All unapproved input → empty output
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Types (mirrored from TestimonialsSection.tsx) ────────────────────────────

interface Testimonial {
  _id: string;
  branchId: string;
  authorName: string;
  rating: number; // 1–5 integer
  text: string;
  date: Date | string;
  approved: boolean;
}

// ─── Pure logic under test (extracted from TestimonialsSection.tsx) ───────────

const MAX_TESTIMONIALS = 10;

/**
 * Mirrors the prepareTestimonials helper from TestimonialsSection.tsx exactly:
 *   1. Filter to approved === true only
 *   2. Sort by date descending (newest first)
 *   3. Slice to at most MAX_TESTIMONIALS (10)
 */
function prepareTestimonials(testimonials: Testimonial[]): Testimonial[] {
  return testimonials
    .filter((t) => t.approved === true)
    .sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, MAX_TESTIMONIALS);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Testimonial's date field to a comparable timestamp */
function toTimestamp(date: Date | string): number {
  return typeof date === 'string' ? new Date(date).getTime() : date.getTime();
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Safe ISO date string arbitrary.
 * Uses a fixed list of valid ISO 8601 date strings spanning several years to
 * avoid fc.date() epoch edge cases (year 0, negative timestamps, etc.).
 */
const safeIsoDates = [
  '2020-01-01T00:00:00.000Z',
  '2020-06-15T12:00:00.000Z',
  '2021-03-20T08:30:00.000Z',
  '2021-11-10T18:45:00.000Z',
  '2022-07-04T10:00:00.000Z',
  '2022-12-31T23:59:59.000Z',
  '2023-02-14T09:00:00.000Z',
  '2023-05-01T00:00:00.000Z',
  '2023-09-25T15:30:00.000Z',
  '2024-01-01T00:00:00.000Z',
  '2024-03-15T12:00:00.000Z',
  '2024-06-20T06:00:00.000Z',
  '2024-08-08T08:08:08.000Z',
  '2024-10-31T23:00:00.000Z',
  '2025-01-15T07:00:00.000Z',
  '2025-04-01T00:00:00.000Z',
  '2025-07-07T14:00:00.000Z',
  '2025-09-30T21:00:00.000Z',
] as const;

/** Arbitrary for a safe ISO date string */
const safeDateStringArb: fc.Arbitrary<string> = fc.constantFrom(...safeIsoDates);

/** Arbitrary for a date value — either a Date object or an ISO string */
const dateArb: fc.Arbitrary<Date | string> = fc.oneof(
  safeDateStringArb,
  safeDateStringArb.map((s) => new Date(s)),
);

/** Arbitrary for a single Testimonial */
const testimonialArb: fc.Arbitrary<Testimonial> = fc.record({
  _id: fc.uuid(),
  branchId: fc.string({ minLength: 1, maxLength: 40 }),
  authorName: fc.string({ minLength: 1, maxLength: 80 }),
  rating: fc.integer({ min: 1, max: 5 }),
  text: fc.string({ minLength: 1, maxLength: 1000 }),
  date: dateArb,
  approved: fc.boolean(),
});

/** Arbitrary for an approved testimonial */
const approvedTestimonialArb: fc.Arbitrary<Testimonial> = testimonialArb.map((t) => ({
  ...t,
  approved: true,
}));

/** Arbitrary for an unapproved testimonial */
const unapprovedTestimonialArb: fc.Arbitrary<Testimonial> = testimonialArb.map((t) => ({
  ...t,
  approved: false,
}));

/** Arbitrary for an array of testimonials with mixed approval status (0–30 items) */
const testimonialArrayArb: fc.Arbitrary<Testimonial[]> = fc.array(testimonialArb, {
  minLength: 0,
  maxLength: 30,
});

/** Arbitrary for an array of approved testimonials only (0–20 items) */
const approvedOnlyArrayArb: fc.Arbitrary<Testimonial[]> = fc.array(approvedTestimonialArb, {
  minLength: 0,
  maxLength: 20,
});

/** Arbitrary for an array of unapproved testimonials only (0–20 items) */
const unapprovedOnlyArrayArb: fc.Arbitrary<Testimonial[]> = fc.array(unapprovedTestimonialArb, {
  minLength: 0,
  maxLength: 20,
});

/**
 * Arbitrary for an array with MORE than 10 approved testimonials.
 * Generates 11–25 approved items, with optional additional unapproved ones mixed in.
 */
const moreThan10ApprovedArb: fc.Arbitrary<Testimonial[]> = fc
  .tuple(
    fc.array(approvedTestimonialArb, { minLength: 11, maxLength: 25 }),
    fc.array(unapprovedTestimonialArb, { minLength: 0, maxLength: 10 }),
  )
  .chain(([approved, unapproved]) => {
    const combined = [...approved, ...unapproved];
    // Shuffle to interleave approved and unapproved items
    return fc.shuffledSubarray(combined, { minLength: combined.length, maxLength: combined.length });
  });

/**
 * Arbitrary for an array with AT MOST 10 approved testimonials (0–10),
 * with optional additional unapproved ones.
 */
const atMost10ApprovedArb: fc.Arbitrary<Testimonial[]> = fc
  .tuple(
    fc.array(approvedTestimonialArb, { minLength: 0, maxLength: 10 }),
    fc.array(unapprovedTestimonialArb, { minLength: 0, maxLength: 10 }),
  )
  .chain(([approved, unapproved]) => {
    const combined = [...approved, ...unapproved];
    if (combined.length === 0) return fc.constant(combined);
    return fc.shuffledSubarray(combined, {
      minLength: combined.length,
      maxLength: combined.length,
    });
  });

// ─── Property 8a — Approved-only filtering ───────────────────────────────────

describe('Property 8a — result never contains a testimonial with approved === false', () => {
  it('no unapproved testimonial appears in the result for any mixed input', () => {
    fc.assert(
      fc.property(testimonialArrayArb, (items) => {
        const result = prepareTestimonials(items);
        for (const t of result) {
          expect(t.approved).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('result contains no item with approved === false even when all inputs are unapproved', () => {
    fc.assert(
      fc.property(unapprovedOnlyArrayArb, (items) => {
        const result = prepareTestimonials(items);
        const hasUnapproved = result.some((t) => t.approved === false);
        expect(hasUnapproved).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 8b — At-most-10 limit ──────────────────────────────────────────

describe('Property 8b — result length is always ≤ 10', () => {
  it('result length never exceeds 10 for any input array', () => {
    fc.assert(
      fc.property(testimonialArrayArb, (items) => {
        const result = prepareTestimonials(items);
        expect(result.length).toBeLessThanOrEqual(10);
      }),
      { numRuns: 200 },
    );
  });

  it('result length never exceeds 10 even when there are many approved testimonials', () => {
    fc.assert(
      fc.property(moreThan10ApprovedArb, (items) => {
        const result = prepareTestimonials(items);
        expect(result.length).toBeLessThanOrEqual(10);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 8c — Date ordering (descending) ────────────────────────────────

describe('Property 8c — consecutive pairs in result satisfy date[i] >= date[i+1]', () => {
  it('each item in the result has a date >= the next item\'s date', () => {
    fc.assert(
      fc.property(testimonialArrayArb, (items) => {
        const result = prepareTestimonials(items);
        for (let i = 0; i < result.length - 1; i++) {
          const current = toTimestamp(result[i].date);
          const next = toTimestamp(result[i + 1].date);
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('result is ordered newest-first for any mix of Date objects and ISO strings', () => {
    fc.assert(
      fc.property(approvedOnlyArrayArb, (items) => {
        const result = prepareTestimonials(items);
        for (let i = 0; i + 1 < result.length; i++) {
          expect(toTimestamp(result[i].date)).toBeGreaterThanOrEqual(
            toTimestamp(result[i + 1].date),
          );
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 8d — Completeness when N ≤ 10 ─────────────────────────────────

describe('Property 8d — if N approved testimonials exist (N ≤ 10), result length === N', () => {
  it('all approved testimonials appear when there are ≤ 10 of them', () => {
    fc.assert(
      fc.property(atMost10ApprovedArb, (items) => {
        const approvedCount = items.filter((t) => t.approved === true).length;
        const result = prepareTestimonials(items);
        expect(result.length).toBe(approvedCount);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 8e — Exactly 10 when more than 10 approved ─────────────────────

describe('Property 8e — if > 10 approved testimonials exist, result length === 10', () => {
  it('result is exactly 10 when there are more than 10 approved testimonials', () => {
    fc.assert(
      fc.property(moreThan10ApprovedArb, (items) => {
        const result = prepareTestimonials(items);
        expect(result.length).toBe(10);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 8f — Empty input → empty output ────────────────────────────────

describe('Property 8f — empty input produces empty output', () => {
  it('prepareTestimonials([]) returns []', () => {
    const result = prepareTestimonials([]);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});

// ─── Property 8g — All unapproved input → empty output ───────────────────────

describe('Property 8g — all unapproved input produces empty output', () => {
  it('returns [] for any array of unapproved testimonials', () => {
    fc.assert(
      fc.property(unapprovedOnlyArrayArb, (items) => {
        const result = prepareTestimonials(items);
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Deterministic edge cases ─────────────────────────────────────────────────

describe('Deterministic edge cases for prepareTestimonials', () => {
  const makeTestimonial = (
    id: string,
    approved: boolean,
    date: string,
  ): Testimonial => ({
    _id: id,
    branchId: 'ln-vidhani',
    authorName: 'Test Author',
    rating: 5,
    text: 'Great place!',
    date,
    approved,
  });

  it('returns approved items only, ignoring unapproved ones', () => {
    const input = [
      makeTestimonial('1', true, '2024-03-01T00:00:00.000Z'),
      makeTestimonial('2', false, '2024-03-02T00:00:00.000Z'),
      makeTestimonial('3', true, '2024-03-03T00:00:00.000Z'),
      makeTestimonial('4', false, '2024-03-04T00:00:00.000Z'),
    ];
    const result = prepareTestimonials(input);
    expect(result.length).toBe(2);
    expect(result.every((t) => t.approved)).toBe(true);
  });

  it('orders approved testimonials newest-first', () => {
    const input = [
      makeTestimonial('1', true, '2023-01-01T00:00:00.000Z'),
      makeTestimonial('2', true, '2025-01-01T00:00:00.000Z'),
      makeTestimonial('3', true, '2024-01-01T00:00:00.000Z'),
    ];
    const result = prepareTestimonials(input);
    expect(result[0]._id).toBe('2'); // newest: 2025
    expect(result[1]._id).toBe('3'); // middle: 2024
    expect(result[2]._id).toBe('1'); // oldest: 2023
  });

  it('slices to exactly 10 when there are 15 approved testimonials', () => {
    const input = Array.from({ length: 15 }, (_, i) =>
      makeTestimonial(`${i}`, true, `2024-0${(i % 9) + 1}-01T00:00:00.000Z`),
    );
    const result = prepareTestimonials(input);
    expect(result.length).toBe(10);
  });

  it('returns all 10 when there are exactly 10 approved testimonials', () => {
    const input = Array.from({ length: 10 }, (_, i) =>
      makeTestimonial(`${i}`, true, `2024-0${(i % 9) + 1}-01T00:00:00.000Z`),
    );
    const result = prepareTestimonials(input);
    expect(result.length).toBe(10);
  });

  it('handles Date objects and ISO strings interchangeably in sort order', () => {
    const t1: Testimonial = {
      _id: 'date-obj',
      branchId: 'ln-vidhani',
      authorName: 'A',
      rating: 4,
      text: 'Good',
      date: new Date('2025-01-01T00:00:00.000Z'), // Date object
      approved: true,
    };
    const t2: Testimonial = {
      _id: 'iso-str',
      branchId: 'ln-vidhani',
      authorName: 'B',
      rating: 3,
      text: 'OK',
      date: '2024-01-01T00:00:00.000Z', // ISO string
      approved: true,
    };
    const result = prepareTestimonials([t2, t1]); // Intentionally out of order
    expect(result[0]._id).toBe('date-obj'); // 2025 is newer
    expect(result[1]._id).toBe('iso-str');  // 2024 is older
  });

  it('single approved testimonial is returned as-is', () => {
    const input = [makeTestimonial('solo', true, '2024-06-01T00:00:00.000Z')];
    const result = prepareTestimonials(input);
    expect(result.length).toBe(1);
    expect(result[0]._id).toBe('solo');
  });

  it('unapproved testimonial with a later date does not appear in result', () => {
    const input = [
      makeTestimonial('unapproved-newest', false, '2025-12-31T00:00:00.000Z'),
      makeTestimonial('approved-older', true, '2024-01-01T00:00:00.000Z'),
    ];
    const result = prepareTestimonials(input);
    expect(result.length).toBe(1);
    expect(result[0]._id).toBe('approved-older');
    expect(result[0].approved).toBe(true);
  });
});
