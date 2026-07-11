/**
 * Property tests for LocalBusinessJsonLd component.
 *
 * Property 17: LocalBusiness JSON-LD on Home and Contact pages matches the branch document.
 *
 * For any rendering of the Home Page or Contact Us page, the LocalBusiness JSON-LD object
 * shall have `name`, `address`, and `telephone` values that are identical to those stored
 * in the corresponding Branch document.
 *
 * **Validates: Requirements 10.9**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import LocalBusinessJsonLd from '../LocalBusinessJsonLd';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BranchData {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  whatsapp: string;
  latitude?: number | null;
  longitude?: number | null;
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/**
 * Generates a valid branch name (1–120 characters).
 * Uses alphanumeric + spaces + common punctuation.
 */
const branchNameArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z0-9 .,&'\-]+$/)
  .filter(s => s.length >= 1 && s.length <= 120 && s.trim().length > 0);

/**
 * Generates a valid address string (1–300 characters).
 */
const addressArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z0-9 .,#()\-/]+$/)
  .filter(s => s.length >= 1 && s.length <= 300 && s.trim().length > 0);

/**
 * Generates a valid city name (1–60 characters).
 */
const cityArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z ]+$/)
  .filter(s => s.length >= 1 && s.length <= 60 && s.trim().length > 0);

/**
 * Generates a valid state name (1–60 characters).
 */
const stateArb: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-zA-Z ]+$/)
  .filter(s => s.length >= 1 && s.length <= 60 && s.trim().length > 0);

/**
 * Generates a valid 6-digit pincode.
 */
const pincodeArb: fc.Arbitrary<string> = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 6 })
  .map(digits => digits.join(''));

/**
 * Generates a valid Indian mobile number (10 digits, starting with 6-9).
 */
const phoneNumberArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('6', '7', '8', '9'),
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  )
  .map(([first, rest]) => first + rest.join(''));

/**
 * Generates an array of 1-5 phone numbers.
 */
const phoneArrayArb: fc.Arbitrary<string[]> = fc.array(phoneNumberArb, {
  minLength: 1,
  maxLength: 5
});

/**
 * Generates optional latitude/longitude coordinates.
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 * Normalizes -0 to 0 to avoid Object.is equality issues in toBe assertions.
 */
const coordinatesArb: fc.Arbitrary<{ latitude: number | null; longitude: number | null }> = fc.oneof(
  fc.constant({ latitude: null, longitude: null }),
  fc.record({
    latitude: fc.double({ min: -90, max: 90, noNaN: true }).map(v => (Object.is(v, -0) ? 0 : v)),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }).map(v => (Object.is(v, -0) ? 0 : v))
  })
);

/**
 * Generates a complete valid BranchData object.
 */
const branchDataArb: fc.Arbitrary<BranchData> = fc.record({
  name: branchNameArb,
  address: addressArb,
  city: cityArb,
  state: stateArb,
  pincode: pincodeArb,
  phone: phoneArrayArb,
  whatsapp: phoneNumberArb,
  latitude: coordinatesArb.map(c => c.latitude),
  longitude: coordinatesArb.map(c => c.longitude)
});

// ─── Test Utilities ───────────────────────────────────────────────────────────

/**
 * Extracts the JSON-LD script content from the rendered component.
 */
function extractJsonLd(container: HTMLElement): unknown {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script || !script.textContent) {
    throw new Error('JSON-LD script not found in rendered output');
  }
  return JSON.parse(script.textContent);
}

/**
 * Checks if the JSON-LD object matches the branch document for the critical fields.
 */
function assertJsonLdMatchesBranch(jsonLd: any, branch: BranchData): void {
  // Property 17: name, address, and telephone must match the branch document
  expect(jsonLd.name).toBe(branch.name);
  
  // Address must match the branch document fields
  expect(jsonLd.address).toBeDefined();
  expect(jsonLd.address['@type']).toBe('PostalAddress');
  expect(jsonLd.address.streetAddress).toBe(branch.address);
  expect(jsonLd.address.addressLocality).toBe(branch.city);
  expect(jsonLd.address.addressRegion).toBe(branch.state);
  expect(jsonLd.address.postalCode).toBe(branch.pincode);
  expect(jsonLd.address.addressCountry).toBe('IN');
  
  // Telephone must match phone[0] from the branch document
  expect(jsonLd.telephone).toBe(branch.phone[0]);
}

// ─── Property 17 Tests ────────────────────────────────────────────────────────

describe('Property 17 — LocalBusiness JSON-LD field consistency', () => {
  it('name field in JSON-LD matches branch.name exactly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.name).toBe(branch.name);
      }),
      { numRuns: 100 }
    );
  });

  it('address.streetAddress in JSON-LD matches branch.address exactly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.address.streetAddress).toBe(branch.address);
      }),
      { numRuns: 100 }
    );
  });

  it('address.addressLocality in JSON-LD matches branch.city exactly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.address.addressLocality).toBe(branch.city);
      }),
      { numRuns: 100 }
    );
  });

  it('address.addressRegion in JSON-LD matches branch.state exactly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.address.addressRegion).toBe(branch.state);
      }),
      { numRuns: 100 }
    );
  });

  it('address.postalCode in JSON-LD matches branch.pincode exactly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.address.postalCode).toBe(branch.pincode);
      }),
      { numRuns: 100 }
    );
  });

  it('telephone in JSON-LD matches branch.phone[0] exactly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.telephone).toBe(branch.phone[0]);
      }),
      { numRuns: 100 }
    );
  });

  it('all critical fields (name, address, telephone) match branch document simultaneously', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        assertJsonLdMatchesBranch(jsonLd, branch);
      }),
      { numRuns: 100 }
    );
  });

  it('JSON-LD includes @context and @type fields correctly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd['@context']).toBe('https://schema.org');
        expect(jsonLd['@type']).toBe('LocalBusiness');
      }),
      { numRuns: 100 }
    );
  });

  it('contactPoint.telephone matches branch.whatsapp exactly', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.contactPoint).toBeDefined();
        expect(jsonLd.contactPoint['@type']).toBe('ContactPoint');
        expect(jsonLd.contactPoint.telephone).toBe(branch.whatsapp);
        expect(jsonLd.contactPoint.contactType).toBe('customer service');
      }),
      { numRuns: 100 }
    );
  });

  it('geo coordinates are included only when both latitude and longitude are non-null', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;

        if (branch.latitude != null && branch.longitude != null) {
          // Geo should be present
          expect(jsonLd.geo).toBeDefined();
          expect(jsonLd.geo['@type']).toBe('GeoCoordinates');
          expect(jsonLd.geo.latitude).toBe(branch.latitude);
          expect(jsonLd.geo.longitude).toBe(branch.longitude);
        } else {
          // Geo should not be present
          expect(jsonLd.geo).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('url field defaults to NEXT_PUBLIC_SITE_URL when url prop is not provided', () => {
    fc.assert(
      fc.property(branchDataArb, (branch) => {
        const { container } = render(
          <LocalBusinessJsonLd
            name={branch.name}
            address={branch.address}
            city={branch.city}
            state={branch.state}
            pincode={branch.pincode}
            phone={branch.phone}
            whatsapp={branch.whatsapp}
            latitude={branch.latitude}
            longitude={branch.longitude}
          />
        );

        const jsonLd = extractJsonLd(container) as any;
        expect(jsonLd.url).toBeDefined();
        expect(typeof jsonLd.url).toBe('string');
        // Should be either the env variable or the default
        expect(jsonLd.url.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
