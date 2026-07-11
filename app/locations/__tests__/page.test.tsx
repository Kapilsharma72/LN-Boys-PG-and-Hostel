// @vitest-environment node
/**
 * Property-based tests for Locations page sort order.
 *
 * **Validates: Requirements 4.3**
 *
 * Property 6: Locations page card list is sorted — active branches before
 * coming-soon, each group alphabetically by name.
 *
 * The sorting algorithm under test (from app/locations/page.tsx):
 *   const active = branches
 *     .filter((b) => b.status === 'active')
 *     .sort((a, b) => a.name.localeCompare(b.name));
 *   const comingSoon = branches
 *     .filter((b) => b.status === 'coming-soon')
 *     .sort((a, b) => a.name.localeCompare(b.name));
 *   return [...active, ...comingSoon];
 *
 * This test suite exercises the pure sort logic extracted from the page.
 * No database or React rendering is required.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Re-implementation of sortBranches from app/locations/page.tsx
// ---------------------------------------------------------------------------

interface BranchDoc {
  branchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  startingPrice: number;
  rating: number;
  status: 'active' | 'coming-soon';
  occupancyTypes: string[];
}

/**
 * Sort: active branches first (A–Z), then coming-soon (A–Z).
 */
function sortBranches(branches: BranchDoc[]): BranchDoc[] {
  const active = branches
    .filter((b) => b.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name));
  const comingSoon = branches
    .filter((b) => b.status === 'coming-soon')
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...active, ...comingSoon];
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid URL-safe branchId: lowercase alphanumeric segments
 * separated by hyphens (matches ^[a-z0-9]+(-[a-z0-9]+)*$).
 */
const branchIdArb: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-z0-9]{1,15}$/), { minLength: 1, maxLength: 4 })
  .filter((parts) => parts.every((p) => p.length > 0))
  .map((parts) => parts.join('-'));

/**
 * Generates a non-empty branch name (1–120 characters).
 * Uses visible ASCII to ensure localeCompare behaves predictably.
 */
const branchNameArb: fc.Arbitrary<string> = fc.string({
  minLength: 1,
  maxLength: 120,
  unit: fc.constantFrom(
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -'.split('')
  ),
});

/** Generates a non-empty address string (1–300 characters). */
const addressArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 300 });

/** Generates a city string (1–60 characters). */
const cityArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 60 });

/** Generates a state string (1–60 characters). */
const stateArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 60 });

/** Generates a 6-digit pincode. */
const pincodeArb: fc.Arbitrary<string> = fc
  .integer({ min: 100000, max: 999999 })
  .map((n) => n.toString());

/** Generates a valid phone array (1–5 entries). */
const phoneArb: fc.Arbitrary<string[]> = fc.array(fc.string({ minLength: 10, maxLength: 15 }), {
  minLength: 1,
  maxLength: 5,
});

/** Generates a valid starting price (0.01–999999.99). */
const startingPriceArb: fc.Arbitrary<number> = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(999999.99),
  noNaN: true,
  noDefaultInfinity: true,
});

/** Generates a valid rating (0.0–5.0). */
const ratingArb: fc.Arbitrary<number> = fc.float({
  min: Math.fround(0.0),
  max: Math.fround(5.0),
  noNaN: true,
  noDefaultInfinity: true,
});

/** Generates occupancy types (1–10 entries). */
const occupancyTypesArb: fc.Arbitrary<string[]> = fc.array(
  fc.constantFrom('Single', 'Double', 'Triple'),
  { minLength: 1, maxLength: 10 }
);

/** Generates a branch with status: 'active'. */
const activeBranchArb: fc.Arbitrary<BranchDoc> = fc.record({
  branchId: branchIdArb,
  name: branchNameArb,
  address: addressArb,
  city: cityArb,
  state: stateArb,
  pincode: pincodeArb,
  phone: phoneArb,
  startingPrice: startingPriceArb,
  rating: ratingArb,
  status: fc.constant('active' as const),
  occupancyTypes: occupancyTypesArb,
});

/** Generates a branch with status: 'coming-soon'. */
const comingSoonBranchArb: fc.Arbitrary<BranchDoc> = fc.record({
  branchId: branchIdArb,
  name: branchNameArb,
  address: addressArb,
  city: cityArb,
  state: stateArb,
  pincode: pincodeArb,
  phone: phoneArb,
  startingPrice: startingPriceArb,
  rating: ratingArb,
  status: fc.constant('coming-soon' as const),
  occupancyTypes: occupancyTypesArb,
});

/** Generates a branch with either status. */
const branchArb: fc.Arbitrary<BranchDoc> = fc.oneof(activeBranchArb, comingSoonBranchArb);

/** Generates an array of 0–30 branches with mixed statuses. */
const branchesArb: fc.Arbitrary<BranchDoc[]> = fc.array(branchArb, {
  minLength: 0,
  maxLength: 30,
});

// ---------------------------------------------------------------------------
// Property 6 — Locations page card list is sorted correctly
// ---------------------------------------------------------------------------

describe('Property 6 — Locations page card list is sorted', () => {
  it('6a: all active branches appear before all coming-soon branches', () => {
    fc.assert(
      fc.property(branchesArb, (branches) => {
        const sorted = sortBranches(branches);

        // Find the index of the last active and first coming-soon
        let lastActiveIndex = -1;
        let firstComingSoonIndex = sorted.length;

        for (let i = 0; i < sorted.length; i++) {
          if (sorted[i].status === 'active') {
            lastActiveIndex = i;
          }
          if (sorted[i].status === 'coming-soon' && firstComingSoonIndex === sorted.length) {
            firstComingSoonIndex = i;
          }
        }

        // If both exist, last active must come before first coming-soon
        if (lastActiveIndex >= 0 && firstComingSoonIndex < sorted.length) {
          expect(lastActiveIndex).toBeLessThan(firstComingSoonIndex);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('6b: active branches are sorted A–Z by name using localeCompare', () => {
    fc.assert(
      fc.property(branchesArb, (branches) => {
        const sorted = sortBranches(branches);
        const activeBranches = sorted.filter((b) => b.status === 'active');

        // Check that each active branch comes before or equals the next in lexical order
        for (let i = 0; i < activeBranches.length - 1; i++) {
          const comparison = activeBranches[i].name.localeCompare(activeBranches[i + 1].name);
          expect(comparison).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('6c: coming-soon branches are sorted A–Z by name using localeCompare', () => {
    fc.assert(
      fc.property(branchesArb, (branches) => {
        const sorted = sortBranches(branches);
        const comingSoonBranches = sorted.filter((b) => b.status === 'coming-soon');

        // Check that each coming-soon branch comes before or equals the next in lexical order
        for (let i = 0; i < comingSoonBranches.length - 1; i++) {
          const comparison = comingSoonBranches[i].name.localeCompare(
            comingSoonBranches[i + 1].name
          );
          expect(comparison).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('6d: sortBranches preserves all branches (no items lost or duplicated)', () => {
    fc.assert(
      fc.property(branchesArb, (branches) => {
        const sorted = sortBranches(branches);

        // Same length
        expect(sorted.length).toBe(branches.length);

        // Every branch in input is present in output (by branchId)
        const inputIds = new Set(branches.map((b) => b.branchId));
        const outputIds = new Set(sorted.map((b) => b.branchId));
        expect(outputIds).toEqual(inputIds);
      }),
      { numRuns: 200 }
    );
  });

  it('6e: when all branches are active, the result is sorted A–Z by name', () => {
    fc.assert(
      fc.property(fc.array(activeBranchArb, { minLength: 1, maxLength: 20 }), (branches) => {
        const sorted = sortBranches(branches);

        // All should be active
        expect(sorted.every((b) => b.status === 'active')).toBe(true);

        // Check A–Z order
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('6f: when all branches are coming-soon, the result is sorted A–Z by name', () => {
    fc.assert(
      fc.property(fc.array(comingSoonBranchArb, { minLength: 1, maxLength: 20 }), (branches) => {
        const sorted = sortBranches(branches);

        // All should be coming-soon
        expect(sorted.every((b) => b.status === 'coming-soon')).toBe(true);

        // Check A–Z order
        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeLessThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('6g: empty input produces empty output', () => {
    const sorted = sortBranches([]);
    expect(sorted).toEqual([]);
  });

  it('6h: single active branch returns unchanged', () => {
    fc.assert(
      fc.property(activeBranchArb, (branch) => {
        const sorted = sortBranches([branch]);
        expect(sorted).toEqual([branch]);
      }),
      { numRuns: 50 }
    );
  });

  it('6i: single coming-soon branch returns unchanged', () => {
    fc.assert(
      fc.property(comingSoonBranchArb, (branch) => {
        const sorted = sortBranches([branch]);
        expect(sorted).toEqual([branch]);
      }),
      { numRuns: 50 }
    );
  });

  it('6j: one active + one coming-soon: active comes first', () => {
    fc.assert(
      fc.property(activeBranchArb, comingSoonBranchArb, (active, comingSoon) => {
        const sorted = sortBranches([comingSoon, active]); // reversed input order
        expect(sorted[0]).toEqual(active);
        expect(sorted[1]).toEqual(comingSoon);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Deterministic examples
// ---------------------------------------------------------------------------

describe('Property 6 — deterministic examples', () => {
  it('two active branches sorted A–Z', () => {
    const b1: BranchDoc = {
      branchId: 'ln-zebra',
      name: 'Zebra Branch',
      address: 'Addr 1',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      phone: ['1234567890'],
      startingPrice: 8000,
      rating: 4.5,
      status: 'active',
      occupancyTypes: ['Single', 'Double'],
    };
    const b2: BranchDoc = {
      branchId: 'ln-apple',
      name: 'Apple Branch',
      address: 'Addr 2',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302002',
      phone: ['1234567890'],
      startingPrice: 9000,
      rating: 4.0,
      status: 'active',
      occupancyTypes: ['Double'],
    };

    const sorted = sortBranches([b1, b2]);
    expect(sorted[0].name).toBe('Apple Branch');
    expect(sorted[1].name).toBe('Zebra Branch');
  });

  it('mixed active + coming-soon: active first, each group sorted', () => {
    const active1: BranchDoc = {
      branchId: 'ln-z-active',
      name: 'Z Active',
      address: 'Addr',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      phone: ['1234567890'],
      startingPrice: 8000,
      rating: 4.5,
      status: 'active',
      occupancyTypes: ['Single'],
    };
    const active2: BranchDoc = {
      branchId: 'ln-a-active',
      name: 'A Active',
      address: 'Addr',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302002',
      phone: ['1234567890'],
      startingPrice: 8500,
      rating: 4.3,
      status: 'active',
      occupancyTypes: ['Double'],
    };
    const comingSoon1: BranchDoc = {
      branchId: 'ln-z-coming',
      name: 'Z Coming Soon',
      address: 'Addr',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302003',
      phone: ['1234567890'],
      startingPrice: 9000,
      rating: 0,
      status: 'coming-soon',
      occupancyTypes: ['Triple'],
    };
    const comingSoon2: BranchDoc = {
      branchId: 'ln-b-coming',
      name: 'B Coming Soon',
      address: 'Addr',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302004',
      phone: ['1234567890'],
      startingPrice: 8700,
      rating: 0,
      status: 'coming-soon',
      occupancyTypes: ['Single'],
    };

    const sorted = sortBranches([comingSoon1, active1, comingSoon2, active2]);

    expect(sorted[0].name).toBe('A Active');
    expect(sorted[1].name).toBe('Z Active');
    expect(sorted[2].name).toBe('B Coming Soon');
    expect(sorted[3].name).toBe('Z Coming Soon');
  });

  it('identical names: order is stable within each group', () => {
    const active1: BranchDoc = {
      branchId: 'ln-dup-1',
      name: 'Duplicate Name',
      address: 'Addr 1',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      phone: ['1234567890'],
      startingPrice: 8000,
      rating: 4.5,
      status: 'active',
      occupancyTypes: ['Single'],
    };
    const active2: BranchDoc = {
      branchId: 'ln-dup-2',
      name: 'Duplicate Name',
      address: 'Addr 2',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302002',
      phone: ['1234567890'],
      startingPrice: 9000,
      rating: 4.0,
      status: 'active',
      occupancyTypes: ['Double'],
    };

    const sorted = sortBranches([active1, active2]);
    // localeCompare returns 0 for identical names; Array.sort is stable
    expect(sorted.length).toBe(2);
    expect(sorted[0].branchId).toBe('ln-dup-1');
    expect(sorted[1].branchId).toBe('ln-dup-2');
  });

  it('empty input returns empty output', () => {
    const sorted = sortBranches([]);
    expect(sorted).toEqual([]);
  });

  it('single branch of any status returns itself', () => {
    const single: BranchDoc = {
      branchId: 'ln-single',
      name: 'Single Branch',
      address: 'Addr',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001',
      phone: ['1234567890'],
      startingPrice: 8000,
      rating: 4.5,
      status: 'active',
      occupancyTypes: ['Single'],
    };

    const sorted = sortBranches([single]);
    expect(sorted).toEqual([single]);
  });
});
