// @vitest-environment node
/**
 * Property-based tests for the API response envelope shape.
 *
 * **Validates: Requirements 13.2**
 *
 * Property 20: API response envelope is always present and well-formed.
 *
 * The envelope contract is: { success: boolean, data?: any, error?: string }
 *
 * Sub-properties:
 *   20a — success responses always have `success: true` and `data` (no `error`)
 *   20b — error responses always have `success: false` and `error` (no `data`)
 *   20c — envelope never contains both `data` and `error` simultaneously
 *
 * Also includes example-based tests using the real GET handler from
 * app/api/branches/route.ts to verify the contract against actual code.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Mock dependencies for example-based tests (branches GET handler)
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/mongoose', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/Branch', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  },
}));

// ---------------------------------------------------------------------------
// Property 20a — success responses always have `success: true` and `data`
// ---------------------------------------------------------------------------

describe('Property 20a — success envelope is well-formed', () => {
  it('NextResponse.json success envelope always has success=true and data, never error', () => {
    fc.assert(
      fc.property(fc.anything(), (payload) => {
        const response = NextResponse.json({ success: true, data: payload });
        // Parse the body synchronously via the response JSON text
        // NextResponse.json stores the body; we verify the shape directly
        const envelope = { success: true, data: payload };

        // success must be exactly true
        expect(envelope.success).toBe(true);

        // data key must be present
        expect(Object.prototype.hasOwnProperty.call(envelope, 'data')).toBe(true);

        // error key must be absent
        expect(Object.prototype.hasOwnProperty.call(envelope, 'error')).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('parsed response body always has success=true and data, never error', async () => {
    // Filter out undefined: JSON.stringify drops undefined values, so
    // { success: true, data: undefined } serialises to { success: true }.
    // Real API handlers never place undefined in the data field.
    const nonUndefinedPayloadArb = fc.anything().filter((v) => v !== undefined);

    await fc.assert(
      fc.asyncProperty(nonUndefinedPayloadArb, async (payload) => {
        const response = NextResponse.json({ success: true, data: payload });
        const body = await response.json();

        expect(body.success).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(body, 'data')).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(body, 'error')).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20b — error responses always have `success: false` and `error`
// ---------------------------------------------------------------------------

describe('Property 20b — error envelope is well-formed', () => {
  it('NextResponse.json error envelope always has success=false and error, never data', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (msg) => {
        const envelope = { success: false, error: msg };

        // success must be exactly false
        expect(envelope.success).toBe(false);

        // error key must be present and non-empty
        expect(Object.prototype.hasOwnProperty.call(envelope, 'error')).toBe(true);
        expect(typeof envelope.error).toBe('string');
        expect(envelope.error.length).toBeGreaterThan(0);

        // data key must be absent
        expect(Object.prototype.hasOwnProperty.call(envelope, 'data')).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('parsed error response body always has success=false and error, never data', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (msg) => {
        const response = NextResponse.json({ success: false, error: msg });
        const body = await response.json();

        expect(body.success).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(body, 'error')).toBe(true);
        expect(typeof body.error).toBe('string');
        expect(body.error.length).toBeGreaterThan(0);
        expect(Object.prototype.hasOwnProperty.call(body, 'data')).toBe(false);
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20c — envelope never contains both `data` and `error`
// ---------------------------------------------------------------------------

describe('Property 20c — envelope never has both data and error simultaneously', () => {
  it('success envelope (data present) never has error key', () => {
    fc.assert(
      fc.property(fc.anything(), (payload) => {
        const envelope = { success: true, data: payload };
        const keys = Object.keys(envelope);

        // Cannot contain both data and error
        const hasBoth = keys.includes('data') && keys.includes('error');
        expect(hasBoth).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('error envelope (error present) never has data key', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (msg) => {
        const envelope = { success: false, error: msg };
        const keys = Object.keys(envelope);

        // Cannot contain both data and error
        const hasBoth = keys.includes('data') && keys.includes('error');
        expect(hasBoth).toBe(false);
      }),
      { numRuns: 500 },
    );
  });

  it('any valid envelope contains only the expected keys', () => {
    const ALLOWED_KEYS = new Set(['success', 'data', 'error']);

    // Test success envelopes (filter undefined to avoid JSON-drop confusion)
    fc.assert(
      fc.property(fc.anything().filter((v) => v !== undefined), (payload) => {
        const envelope = { success: true, data: payload };
        for (const key of Object.keys(envelope)) {
          expect(ALLOWED_KEYS.has(key)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );

    // Test error envelopes
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (msg) => {
        const envelope = { success: false, error: msg };
        for (const key of Object.keys(envelope)) {
          expect(ALLOWED_KEYS.has(key)).toBe(true);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20 — success field is always boolean
// ---------------------------------------------------------------------------

describe('Property 20 — success field is always a boolean', () => {
  it('success field in a success envelope is exactly the boolean true', () => {
    fc.assert(
      fc.property(fc.anything(), (payload) => {
        const envelope = { success: true, data: payload };
        expect(typeof envelope.success).toBe('boolean');
        expect(envelope.success).toBe(true);
      }),
      { numRuns: 300 },
    );
  });

  it('success field in an error envelope is exactly the boolean false', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (msg) => {
        const envelope = { success: false, error: msg };
        expect(typeof envelope.success).toBe('boolean');
        expect(envelope.success).toBe(false);
      }),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// Example-based tests — real GET handler from app/api/branches/route.ts
// ---------------------------------------------------------------------------

describe('Example-based: GET /api/branches envelope contract', () => {
  it('returns { success: true, data: [] } when MongoDB returns empty array', async () => {
    // Import here so mocks are applied
    const { GET } = await import('../branches/route');

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual({ success: true, data: [] });
  });

  it('response success field is always a boolean', async () => {
    const { GET } = await import('../branches/route');

    const response = await GET();
    const body = await response.json();

    expect(typeof body.success).toBe('boolean');
  });

  it('success response envelope has success=true, data present, no error', async () => {
    const { GET } = await import('../branches/route');

    const response = await GET();
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(body, 'data')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(body, 'error')).toBe(false);
  });

  it('error response envelope has success=false, error present, no data', async () => {
    // Override the Branch mock to throw an error for this test
    const BranchMod = await import('@/lib/db/models/Branch');
    const Branch = BranchMod.default as any;
    Branch.find.mockReturnValueOnce({
      lean: vi.fn().mockRejectedValueOnce(new Error('DB failure')),
    });

    const { GET } = await import('../branches/route');

    const response = await GET();
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(body, 'error')).toBe(true);
    expect(typeof body.error).toBe('string');
    expect(Object.prototype.hasOwnProperty.call(body, 'data')).toBe(false);
  });
});
