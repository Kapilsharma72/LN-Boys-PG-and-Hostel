// @vitest-environment node
/**
 * Property-based tests for BranchJsonLd field completeness.
 *
 * **Validates: Requirements 10.2**
 *
 * Property 16: LodgingBusiness JSON-LD on Branch Detail Page contains all
 * required fields matching the branch document.
 *
 * Sub-properties tested:
 *   16a — All required fields are present in the JSON-LD output
 *   16b — Field values match the source branch document
 *   16c — Address structure follows PostalAddress schema
 *   16d — priceRange is derived from startingPrice correctly
 *   16e — aggregateRating structure follows AggregateRating schema
 *   16f — url is correctly constructed from branchId
 *   16g — image field is present when imageUrl is provided
 *   16h — image field is omitted when imageUrl is not provided
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderToString } from 'react-dom/server';
import BranchJsonLd from '../BranchJsonLd';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchData {
  branchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  startingPrice: number;
  rating: number;
  imageUrl?: string;
}

interface LodgingBusinessJsonLd {
  '@context': string;
  '@type': string;
  name: string;
  address: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  telephone: string;
  priceRange: string;
  aggregateRating: {
    '@type': string;
    ratingValue: number;
    bestRating: number;
    worstRating: number;
    ratingCount: number;
  };
  url: string;
  image?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract JSON-LD content from rendered BranchJsonLd component.
 */
function extractJsonLd(html: string): LodgingBusinessJsonLd {
  // Extract content between <script> tags
  const scriptMatch = html.match(/<script[^>]*>(.*?)<\/script>/s);
  if (!scriptMatch || !scriptMatch[1]) {
    throw new Error('No script tag found in rendered output');
  }
  return JSON.parse(scriptMatch[1]) as LodgingBusinessJsonLd;
}

/**
 * Render BranchJsonLd component and extract the JSON-LD object.
 */
function renderAndExtractJsonLd(branchData: BranchData): LodgingBusinessJsonLd {
  const html = renderToString(<BranchJsonLd {...branchData} />);
  return extractJsonLd(html);
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/**
 * Arbitrary for valid branchId (URL-safe slug, 3–80 chars).
 */
const branchIdArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .filter((s) => s.length >= 3 && s.length <= 80);

/**
 * Arbitrary for branch name (1–120 chars).
 */
const nameArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 120 });

/**
 * Arbitrary for address (1–300 chars).
 */
const addressArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 300 });

/**
 * Arbitrary for city (1–60 chars).
 */
const cityArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 60 });

/**
 * Arbitrary for state (1–60 chars).
 */
const stateArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 60 });

/**
 * Arbitrary for pincode (exactly 6 digits).
 */
const pincodeArb: fc.Arbitrary<string> = fc.stringMatching(/^\d{6}$/);

/**
 * Arbitrary for phone array (1–5 entries).
 */
const phoneArb: fc.Arbitrary<string[]> = fc.array(
  fc.string({ minLength: 10, maxLength: 15 }),
  { minLength: 1, maxLength: 5 }
);

/**
 * Arbitrary for startingPrice (0.01–999999.99).
 */
const startingPriceArb: fc.Arbitrary<number> = fc.double({
  min: 0.01,
  max: 999999.99,
  noNaN: true,
});

/**
 * Arbitrary for rating (0.0–5.0).
 */
const ratingArb: fc.Arbitrary<number> = fc.double({
  min: 0.0,
  max: 5.0,
  noNaN: true,
});

/**
 * Arbitrary for optional imageUrl.
 */
const imageUrlArb: fc.Arbitrary<string | undefined> = fc.option(
  fc.webUrl(),
  { nil: undefined }
);

/**
 * Arbitrary for complete branch data.
 */
const branchDataArb: fc.Arbitrary<BranchData> = fc.record({
  branchId: branchIdArb,
  name: nameArb,
  address: addressArb,
  city: cityArb,
  state: stateArb,
  pincode: pincodeArb,
  phone: phoneArb,
  startingPrice: startingPriceArb,
  rating: ratingArb,
  imageUrl: imageUrlArb,
});

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Property 16 — LodgingBusiness JSON-LD field completeness', () => {
  it('16a — All required fields are present in the JSON-LD output', () => {
    fc.assert(
      fc.property(branchDataArb, (branchData) => {
        const jsonLd = renderAndExtractJsonLd(branchData);

        // Required top-level fields
        expect(jsonLd['@context']).toBeDefined();
        expect(jsonLd['@type']).toBeDefined();
        expect(jsonLd.name).toBeDefined();
        expect(jsonLd.address).toBeDefined();
        expect(jsonLd.telephone).toBeDefined();
        expect(jsonLd.priceRange).toBeDefined();
        expect(jsonLd.aggregateRating).toBeDefined();
        expect(jsonLd.url).toBeDefined();

        // Address subfields
        expect(jsonLd.address['@type']).toBeDefined();
        expect(jsonLd.address.streetAddress).toBeDefined();
        expect(jsonLd.address.addressLocality).toBeDefined();
        expect(jsonLd.address.addressRegion).toBeDefined();
        expect(jsonLd.address.postalCode).toBeDefined();
        expect(jsonLd.address.addressCountry).toBeDefined();

        // AggregateRating subfields
        expect(jsonLd.aggregateRating['@type']).toBeDefined();
        expect(jsonLd.aggregateRating.ratingValue).toBeDefined();
        expect(jsonLd.aggregateRating.bestRating).toBeDefined();
        expect(jsonLd.aggregateRating.worstRating).toBeDefined();
        expect(jsonLd.aggregateRating.ratingCount).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('16b — Field values match the source branch document', () => {
    fc.assert(
      fc.property(branchDataArb, (branchData) => {
        const jsonLd = renderAndExtractJsonLd(branchData);

        // Direct field matches
        expect(jsonLd.name).toBe(branchData.name);
        expect(jsonLd.address.streetAddress).toBe(branchData.address);
        expect(jsonLd.address.addressLocality).toBe(branchData.city);
        expect(jsonLd.address.addressRegion).toBe(branchData.state);
        expect(jsonLd.address.postalCode).toBe(branchData.pincode);
        expect(jsonLd.telephone).toBe(branchData.phone[0] ?? '');
        expect(jsonLd.aggregateRating.ratingValue).toBe(branchData.rating);
      }),
      { numRuns: 100 }
    );
  });

  it('16c — Address structure follows PostalAddress schema', () => {
    fc.assert(
      fc.property(branchDataArb, (branchData) => {
        const jsonLd = renderAndExtractJsonLd(branchData);

        expect(jsonLd.address['@type']).toBe('PostalAddress');
        expect(jsonLd.address.addressCountry).toBe('IN');
        expect(typeof jsonLd.address.streetAddress).toBe('string');
        expect(typeof jsonLd.address.addressLocality).toBe('string');
        expect(typeof jsonLd.address.addressRegion).toBe('string');
        expect(typeof jsonLd.address.postalCode).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('16d — priceRange is derived from startingPrice correctly', () => {
    fc.assert(
      fc.property(branchDataArb, (branchData) => {
        const jsonLd = renderAndExtractJsonLd(branchData);

        const expectedMin = `₹${branchData.startingPrice.toLocaleString('en-IN')}`;
        const expectedMax = `₹${(branchData.startingPrice * 2).toLocaleString('en-IN')}`;
        const expectedPriceRange = `${expectedMin} - ${expectedMax}`;

        expect(jsonLd.priceRange).toBe(expectedPriceRange);
      }),
      { numRuns: 100 }
    );
  });

  it('16e — aggregateRating structure follows AggregateRating schema', () => {
    fc.assert(
      fc.property(branchDataArb, (branchData) => {
        const jsonLd = renderAndExtractJsonLd(branchData);

        expect(jsonLd.aggregateRating['@type']).toBe('AggregateRating');
        expect(jsonLd.aggregateRating.ratingValue).toBe(branchData.rating);
        expect(jsonLd.aggregateRating.bestRating).toBe(5);
        expect(jsonLd.aggregateRating.worstRating).toBe(1);
        expect(jsonLd.aggregateRating.ratingCount).toBe(10);
      }),
      { numRuns: 100 }
    );
  });

  it('16f — url is correctly constructed from branchId', () => {
    fc.assert(
      fc.property(branchDataArb, (branchData) => {
        const jsonLd = renderAndExtractJsonLd(branchData);

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';
        const expectedUrl = `${siteUrl}/branch/${branchData.branchId}`;

        expect(jsonLd.url).toBe(expectedUrl);
      }),
      { numRuns: 100 }
    );
  });

  it('16g — image field is present when imageUrl is provided', () => {
    fc.assert(
      fc.property(
        branchDataArb.filter((b) => b.imageUrl !== undefined),
        (branchData) => {
          const jsonLd = renderAndExtractJsonLd(branchData);

          expect(jsonLd.image).toBeDefined();
          expect(jsonLd.image).toBe(branchData.imageUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('16h — image field is omitted when imageUrl is not provided', () => {
    fc.assert(
      fc.property(
        branchDataArb.filter((b) => b.imageUrl === undefined),
        (branchData) => {
          const jsonLd = renderAndExtractJsonLd(branchData);

          expect(jsonLd.image).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('16i — @context and @type are always correct', () => {
    fc.assert(
      fc.property(branchDataArb, (branchData) => {
        const jsonLd = renderAndExtractJsonLd(branchData);

        expect(jsonLd['@context']).toBe('https://schema.org');
        expect(jsonLd['@type']).toBe('LodgingBusiness');
      }),
      { numRuns: 100 }
    );
  });
});
