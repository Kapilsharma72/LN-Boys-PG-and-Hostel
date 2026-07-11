/**
 * Property-based tests for SEO utility functions
 * 
 * Uses fast-check to verify universal properties hold across arbitrary inputs.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateBranchTitle, type BranchForSEO } from '../seo';

/**
 * Arbitrary generator for non-empty strings (branch names, landmarks, cities)
 * Generates realistic strings with printable ASCII characters.
 * Excludes any string containing "|" to avoid breaking the " | " separator,
 * and excludes ", " to avoid breaking the "landmark, city" separator.
 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 120 })
  .filter(s => s.trim().length > 0 && !s.includes('|') && !s.includes(', '));

/**
 * Arbitrary generator for branch IDs
 * Follows the pattern: lowercase alphanumeric with hyphens
 */
const branchIdArb = fc
  .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .filter(s => s.length >= 3 && s.length <= 80);

/**
 * Arbitrary generator for city names
 * Excludes any string containing "|" or ", " to avoid breaking the title separators.
 */
const cityNameArb = fc.string({ minLength: 1, maxLength: 60 })
  .filter(s => s.trim().length > 0 && !s.includes('|') && !s.includes(', '));

/**
 * Arbitrary generator for starting prices
 */
const priceArb = fc.double({ min: 0.01, max: 999999.99, noNaN: true });

/**
 * Arbitrary generator for BranchForSEO objects
 */
const branchArb: fc.Arbitrary<BranchForSEO> = fc.record({
  branchId: branchIdArb,
  name: nonEmptyStringArb,
  city: cityNameArb,
  startingPrice: priceArb,
  metaDescription: fc.option(fc.string({ maxLength: 160 }), { nil: null }),
  heroImageUrl: fc.option(fc.webUrl(), { nil: null }),
});

describe('Property 15 — Branch Detail Page title pattern', () => {
  it('conforms to pattern: [Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        // Generate the title
        const title = generateBranchTitle(branch, landmark);

        // The title should be a non-empty string
        expect(title).toBeDefined();
        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(0);

        // Parse the title into its three segments separated by " | "
        const segments = title.split(' | ');
        
        // The title must have exactly 3 segments
        expect(segments).toHaveLength(3);

        // Segment 1: [Branch Name]
        const segment1 = segments[0];
        expect(segment1).toBe(branch.name);

        // Segment 2: Best Boys PG near [Landmark], [City]
        const segment2 = segments[1];
        const expectedSegment2 = `Best Boys PG near ${landmark}, ${branch.city}`;
        expect(segment2).toBe(expectedSegment2);

        // Segment 3: LN Boys PG & Hostel
        const segment3 = segments[2];
        expect(segment3).toBe('LN Boys PG & Hostel');
      }),
      { numRuns: 100 } // Run at least 100 cases as specified
    );
  });

  it('always contains all three required segments', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);

        // Title must contain the branch name
        expect(title).toContain(branch.name);

        // Title must contain the landmark
        expect(title).toContain(landmark);

        // Title must contain the city
        expect(title).toContain(branch.city);

        // Title must contain the fixed suffix
        expect(title).toContain('LN Boys PG & Hostel');

        // Title must contain the fixed middle pattern
        expect(title).toContain('Best Boys PG near');
      }),
      { numRuns: 100 }
    );
  });

  it('always uses " | " (space-pipe-space) as segment separator', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);

        // Count occurrences of " | " (space-pipe-space)
        const separatorPattern = / \| /g;
        const matches = title.match(separatorPattern);

        // Must have exactly 2 separators (creating 3 segments)
        expect(matches).not.toBeNull();
        expect(matches).toHaveLength(2);
      }),
      { numRuns: 100 }
    );
  });

  it('preserves exact branch name without modification', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);
        const segments = title.split(' | ');

        // The first segment must be exactly the branch name (no trimming, no case changes)
        expect(segments[0]).toBe(branch.name);
      }),
      { numRuns: 100 }
    );
  });

  it('preserves exact landmark name without modification', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);
        const segments = title.split(' | ');
        const middleSegment = segments[1];

        // Extract the landmark from "Best Boys PG near [Landmark], [City]"
        // We need to parse it carefully since landmark and city may contain special characters
        const prefix = 'Best Boys PG near ';
        expect(middleSegment.startsWith(prefix)).toBe(true);
        
        const afterPrefix = middleSegment.slice(prefix.length);
        
        // Find the last occurrence of ", " to split landmark and city
        const lastCommaIndex = afterPrefix.lastIndexOf(', ');
        expect(lastCommaIndex).toBeGreaterThanOrEqual(0);
        
        const extractedLandmark = afterPrefix.slice(0, lastCommaIndex);
        expect(extractedLandmark).toBe(landmark);
      }),
      { numRuns: 100 }
    );
  });

  it('preserves exact city name without modification', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);
        const segments = title.split(' | ');
        const middleSegment = segments[1];

        // Extract the city from "Best Boys PG near [Landmark], [City]"
        // Find the last occurrence of ", " to split landmark and city
        const prefix = 'Best Boys PG near ';
        const afterPrefix = middleSegment.slice(prefix.length);
        const lastCommaIndex = afterPrefix.lastIndexOf(', ');
        
        const extractedCity = afterPrefix.slice(lastCommaIndex + 2);
        expect(extractedCity).toBe(branch.city);
      }),
      { numRuns: 100 }
    );
  });

  it('always ends with "LN Boys PG & Hostel"', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);

        // Title must end with the exact suffix
        expect(title.endsWith('LN Boys PG & Hostel')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('always includes "Best Boys PG near" in the middle segment', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);
        const segments = title.split(' | ');

        // Second segment must start with "Best Boys PG near"
        expect(segments[1].startsWith('Best Boys PG near ')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('format is consistent regardless of string content', () => {
    fc.assert(
      fc.property(branchArb, nonEmptyStringArb, (branch, landmark) => {
        const title = generateBranchTitle(branch, landmark);

        // The pattern should be: segment1 | segment2 | segment3
        // where segment2 = "Best Boys PG near landmark, city"
        const expectedTitle = `${branch.name} | Best Boys PG near ${landmark}, ${branch.city} | LN Boys PG & Hostel`;
        
        expect(title).toBe(expectedTitle);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Validates: Requirements 10.1**
 * 
 * Property 15: Branch Detail Page title conforms to the specified pattern:
 * "[Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel"
 * 
 * This property test ensures that for ANY arbitrary branch name, landmark, and city:
 * - The title has exactly 3 segments separated by " | "
 * - Segment 1 is the exact branch name
 * - Segment 2 follows "Best Boys PG near [Landmark], [City]" pattern
 * - Segment 3 is always "LN Boys PG & Hostel"
 * - No modifications are made to the input strings (no trimming, case changes, etc.)
 */
