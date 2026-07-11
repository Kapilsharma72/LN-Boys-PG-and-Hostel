// @vitest-environment node
/**
 * Property-based tests for API 400 behavior on invalid or missing required parameters.
 *
 * **Validates: Requirements 13.3**
 *
 * Property 21: API 400 response on invalid or missing required parameters.
 *
 * Sub-properties:
 *   21a — Missing required fields always return 400
 *   21b — Invalid enum values always return 400
 *   21c — Invalid branchId format always returns 400
 *   21d — Invalid pincode (not 6 digits) always returns 400
 *   21e — Valid input with admin session returns 201 (not 400)
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mock dependencies — must be at top level (hoisted by Vitest/Vite)
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/mongoose', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/Branch', () => ({
  default: {
    create: vi.fn((data: any) => Promise.resolve(data)),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn().mockResolvedValue({ adminId: 'admin' }),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal fully-valid branch payload */
const validBranch = {
  branchId: 'ln-vidhani',
  name: 'LN Boys PG Vidhani',
  address: 'Near JECRC College, Vidhani, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302017',
  phone: ['+918385857902'],
  whatsapp: '+918385857902',
  startingPrice: 8000,
  status: 'active' as const,
  occupancyTypes: ['Single', 'Double'],
};

/** Helper to call the POST handler with a given body */
async function callPost(body: unknown) {
  // Import inside the function so module-cache resets via vi.resetModules() take effect
  const { POST } = await import('../branches/route');
  const request = new Request('http://localhost:3000/api/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(request);
}

// ---------------------------------------------------------------------------
// Property 21a — Missing required fields always return 400
// ---------------------------------------------------------------------------

describe('Property 21a — missing required fields always return 400', () => {
  /** All required fields for BranchCreateSchema */
  const requiredFields = [
    'branchId',
    'name',
    'address',
    'city',
    'state',
    'pincode',
    'phone',
    'whatsapp',
    'startingPrice',
    'status',
    'occupancyTypes',
  ] as const;

  it('omitting any single required field always yields status 400 with success=false', async () => {
    const fieldArb = fc.constantFrom(...requiredFields);

    await fc.assert(
      fc.asyncProperty(fieldArb, async (field) => {
        const payload = { ...validBranch } as Record<string, unknown>;
        delete payload[field];

        const response = await callPost(payload);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      }),
      { numRuns: 50 },
    );
  });

  it('omitting multiple required fields always returns 400', async () => {
    // Generate a strict subset of fields (always missing at least one)
    const subsetArb = fc
      .subarray([...requiredFields], { minLength: 0, maxLength: requiredFields.length - 1 })
      .map((kept) => {
        const partial: Record<string, unknown> = {};
        for (const k of kept) {
          partial[k] = (validBranch as Record<string, unknown>)[k];
        }
        return partial;
      });

    await fc.assert(
      fc.asyncProperty(subsetArb, async (payload) => {
        const response = await callPost(payload);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 21b — Invalid enum values for `status` always return 400
// ---------------------------------------------------------------------------

describe('Property 21b — invalid status enum always returns 400', () => {
  it('any status value that is not "active" or "coming-soon" yields 400', async () => {
    const invalidStatusArb = fc
      .string({ minLength: 1 })
      .filter((s) => s !== 'active' && s !== 'coming-soon');

    await fc.assert(
      fc.asyncProperty(invalidStatusArb, async (badStatus) => {
        const payload = { ...validBranch, status: badStatus };

        const response = await callPost(payload);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 21c — Invalid branchId format always returns 400
// ---------------------------------------------------------------------------

describe('Property 21c — invalid branchId format always returns 400', () => {
  /**
   * Arbitraries that produce strings violating ^[a-z0-9]+(-[a-z0-9]+)*$:
   *   - contain uppercase letters
   *   - contain spaces
   *   - contain underscores
   *   - start or end with a hyphen
   *   - contain consecutive hyphens
   */
  const invalidBranchIdArb = fc.oneof(
    // Contains at least one uppercase letter — append 'A' to a short slug
    fc.stringMatching(/^[a-z0-9]{3,15}$/).map((s) => s + 'A'),

    // Contains a space
    fc.stringMatching(/^[a-z0-9]{2,10} [a-z0-9]{2,10}$/),

    // Contains an underscore
    fc.stringMatching(/^[a-z0-9]{2,10}_[a-z0-9]{2,10}$/),

    // Starts with a hyphen
    fc.constant('-start'),

    // Ends with a hyphen
    fc.constant('end-'),

    // Consecutive hyphens
    fc.constant('double--hyphen'),

    // Single character (too short)
    fc.constant('a'),
  );

  it('branchId strings failing the slug regex always yield 400', async () => {
    await fc.assert(
      fc.asyncProperty(invalidBranchIdArb, async (badId) => {
        const payload = { ...validBranch, branchId: badId };

        const response = await callPost(payload);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 21d — Invalid pincode (not exactly 6 digits) always returns 400
// ---------------------------------------------------------------------------

describe('Property 21d — invalid pincode always returns 400', () => {
  const invalidPincodeArb = fc.oneof(
    // Too short: 0–5 digits
    fc.nat({ max: 99999 }).map((n) => String(n)), // at most 5 chars without padding

    // Too long: 7+ digits
    fc.integer({ min: 1000000, max: 99999999 }).map((n) => String(n)),

    // Contains non-digit characters (letters, symbols, spaces)
    fc.string({ minLength: 1 }).filter((s) => !/^\d{6}$/.test(s)),
  );

  it('any pincode that is not exactly 6 digits yields 400', async () => {
    await fc.assert(
      fc.asyncProperty(invalidPincodeArb, async (badPincode) => {
        const payload = { ...validBranch, pincode: badPincode };

        const response = await callPost(payload);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 21e — Valid input with admin session returns 201 (not 400)
// ---------------------------------------------------------------------------

describe('Property 21e — valid input with admin session returns 201', () => {
  /**
   * Generates valid branch payloads conforming to BranchCreateSchema:
   *   - branchId: lowercase alphanumeric slug (3–20 chars)
   *   - name/address/city/state/whatsapp: non-empty strings within length limits
   *   - pincode: exactly 6 digits (zero-padded)
   *   - phone: array of 1–5 non-empty strings
   *   - startingPrice: integer in [1, 999999] avoids float precision issues
   *   - status: 'active' | 'coming-soon'
   *   - occupancyTypes: array of 1–5 non-empty strings
   */
  const validBranchArb = fc.record({
    branchId: fc
      .tuple(
        fc.stringMatching(/^[a-z0-9]{3,8}$/),
        fc.array(fc.stringMatching(/^[a-z0-9]{1,6}$/), { minLength: 0, maxLength: 2 }),
      )
      .map(([head, tail]) => (tail.length > 0 ? `${head}-${tail.join('-')}` : head))
      .filter((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) && id.length >= 3 && id.length <= 80),
    name: fc.string({ minLength: 1, maxLength: 80 }),
    address: fc.string({ minLength: 1, maxLength: 200 }),
    city: fc.string({ minLength: 1, maxLength: 40 }),
    state: fc.string({ minLength: 1, maxLength: 40 }),
    pincode: fc.nat({ max: 999999 }).map((n) => String(n).padStart(6, '0')),
    phone: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
    whatsapp: fc.string({ minLength: 1, maxLength: 20 }),
    // Use integers to avoid 32-bit float constraints
    startingPrice: fc.integer({ min: 1, max: 999999 }),
    status: fc.constantFrom('active' as const, 'coming-soon' as const),
    occupancyTypes: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
  });

  it('valid payloads always return 201 and never 400', async () => {
    await fc.assert(
      fc.asyncProperty(validBranchArb, async (payload) => {
        const response = await callPost(payload);
        const body = await response.json();

        // Must not return 400 for valid input
        expect(response.status).not.toBe(400);
        // Must return 201 for successful creation
        expect(response.status).toBe(201);
        expect(body.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
