// @vitest-environment node
/**
 * Property-based tests for rate-limiter behavior in POST /api/leads.
 *
 * **Validates: Requirements 13.5**
 *
 * Property 13: Rate limiter allows at most 5 lead submissions per IP per 10-minute window.
 *
 * Sub-properties:
 *   13a — Rate limit exceeded returns 429 with Retry-After header
 *   13b — Rate limit not exceeded allows request through (returns 201)
 *   13c — checkRateLimit is called with the client IP from x-forwarded-for
 *   13d — When x-forwarded-for is absent, falls back to '127.0.0.1'
 *   13e — retryAfter value appears verbatim in the Retry-After response header
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Module mocks — hoisted by Vitest, so we use vi.fn() inline and retrieve
// typed references via vi.mocked() after imports.
// ---------------------------------------------------------------------------

vi.mock('@/lib/db/mongoose', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/Lead', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn().mockResolvedValue({ adminId: undefined }),
}));

vi.mock('@/lib/notifications/whatsapp', () => ({
  sendLeadNotification: vi.fn().mockResolvedValue(true),
  sendAutoReply: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/notifications/email', () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Import handler and mocked modules after vi.mock declarations
// ---------------------------------------------------------------------------

import { POST } from '../route';
import Lead from '@/lib/db/models/Lead';
import { checkRateLimit } from '@/lib/ratelimit';

// ---------------------------------------------------------------------------
// Typed references to mock functions
// ---------------------------------------------------------------------------

const mockLead = vi.mocked(Lead);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

/** A valid lead payload that passes Zod validation */
const validLeadBody = {
  name: 'Test User',
  mobile: '9876543210',
  intent: 'visit',
  branchId: 'ln-main',
  source: 'enquiry-form',
  whatsappOptIn: false,
};

/** Rate-limit-exceeded result */
const rateLimitExceededResult = {
  success: false,
  retryAfter: 120,
  limit: 5,
  remaining: 0,
  reset: Date.now() + 120_000,
};

/** Rate-limit-allowed result */
const rateLimitAllowedResult = {
  success: true,
  retryAfter: 0,
  limit: 5,
  remaining: 4,
  reset: 0,
};

/** Minimal Lead document stub returned by Lead.create() */
const createdLeadStub = {
  _id: 'new-lead-id',
  name: 'Test User',
  mobile: '9876543210',
  branchId: 'ln-main',
  intent: 'visit',
  source: 'enquiry-form',
  whatsappOptIn: false,
  status: 'new',
  createdAt: new Date(),
  preferredDate: null,
} as any;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a NextRequest-compatible Request with the given body and optional
 * extra headers.
 */
function makeRequest(body: object, extraHeaders: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Reset all mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Property 13a — Rate limit exceeded returns 429 with Retry-After
// ---------------------------------------------------------------------------

describe('Property 13a — Rate limit exceeded returns 429 with Retry-After', () => {
  it('returns HTTP 429 when checkRateLimit indicates the limit is exceeded', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);

    expect(response.status).toBe(429);
  });

  it('returns the correct error body when rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);
    const body = await response.json();

    expect(body).toEqual({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
  });

  it('includes Retry-After header equal to "120" when retryAfter is 120', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);

    expect(response.headers.get('Retry-After')).toBe('120');
  });

  it('does not call Lead.findOne or Lead.create when rate-limited', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    const request = makeRequest(validLeadBody);
    await POST(request as any);

    expect(mockLead.findOne).not.toHaveBeenCalled();
    expect(mockLead.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Property 13b — Rate limit not exceeded allows request through (201)
// ---------------------------------------------------------------------------

describe('Property 13b — Rate limit not exceeded allows request through', () => {
  it('returns 201 when checkRateLimit returns success: true', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitAllowedResult);
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);

    expect(response.status).toBe(201);
  });

  it('does NOT return 429 when rate limit allows the request', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitAllowedResult);
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);

    expect(response.status).not.toBe(429);
  });

  it('returns success: true in the body when rate limit allows the request', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitAllowedResult);
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);
    const body = await response.json();

    expect(body.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 13c — checkRateLimit is called with the client IP from x-forwarded-for
// ---------------------------------------------------------------------------

describe('Property 13c — checkRateLimit is called with the client IP', () => {
  it('passes the first IP in x-forwarded-for to checkRateLimit', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    const request = makeRequest(validLeadBody, { 'x-forwarded-for': '1.2.3.4' });
    await POST(request as any);

    expect(mockCheckRateLimit).toHaveBeenCalledWith('1.2.3.4');
  });

  it('uses only the first IP when x-forwarded-for contains a comma-separated list', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    const request = makeRequest(validLeadBody, {
      'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12',
    });
    await POST(request as any);

    expect(mockCheckRateLimit).toHaveBeenCalledWith('1.2.3.4');
  });

  it('calls checkRateLimit exactly once per request', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitAllowedResult);
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const request = makeRequest(validLeadBody, { 'x-forwarded-for': '1.2.3.4' });
    await POST(request as any);

    expect(mockCheckRateLimit).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Property 13d — When x-forwarded-for is absent, falls back to '127.0.0.1'
// ---------------------------------------------------------------------------

describe("Property 13d — Falls back to '127.0.0.1' when x-forwarded-for is absent", () => {
  it("calls checkRateLimit with '127.0.0.1' when no x-forwarded-for header is present", async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    // No x-forwarded-for header
    const request = makeRequest(validLeadBody);
    await POST(request as any);

    expect(mockCheckRateLimit).toHaveBeenCalledWith('127.0.0.1');
  });

  it("does not use undefined or null as the IP when x-forwarded-for is missing", async () => {
    mockCheckRateLimit.mockResolvedValueOnce(rateLimitExceededResult);

    const request = makeRequest(validLeadBody);
    await POST(request as any);

    const calledIp = mockCheckRateLimit.mock.calls[0][0];
    expect(calledIp).not.toBeNull();
    expect(calledIp).not.toBeUndefined();
    expect(typeof calledIp).toBe('string');
    expect(calledIp.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Property 13e — retryAfter value appears verbatim in the Retry-After header
// (fast-check property-based test)
// ---------------------------------------------------------------------------

describe('Property 13e — retryAfter value appears verbatim in the Retry-After header', () => {
  it('Retry-After header always equals String(retryAfter) for any integer retryAfter in [1, 600]', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 600 }), async (retryAfter) => {
        vi.clearAllMocks();

        mockCheckRateLimit.mockResolvedValueOnce({
          success: false,
          retryAfter,
          limit: 5,
          remaining: 0,
          reset: Date.now() + retryAfter * 1000,
        });

        const request = makeRequest(validLeadBody);
        const response = await POST(request as any);

        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe(String(retryAfter));
      }),
      { numRuns: 50 }
    );
  });
});
