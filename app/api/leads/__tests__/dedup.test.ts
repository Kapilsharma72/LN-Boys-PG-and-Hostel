// @vitest-environment node
/**
 * Property-based tests for duplicate-lead suppression in POST /api/leads.
 *
 * **Validates: Requirements 9.4**
 *
 * Property 12: Duplicate lead suppression within 30-minute window.
 *
 * Sub-properties:
 *   12a — Duplicate lead within 30 min returns 409 with correct error message
 *   12b — No duplicate (null findOne) allows lead creation (returns 201)
 *   12c — The dedup query uses the correct 30-minute time window
 *   12d — Different mobile+branchId combination is not suppressed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// vi.mock factories are hoisted, so we cannot reference module-scope variables
// inside them. Instead we use vi.fn() inline and retrieve references via
// vi.mocked() after the imports are resolved.
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
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    retryAfter: 0,
    limit: 5,
    remaining: 4,
    reset: 0,
  }),
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

// ---------------------------------------------------------------------------
// Typed references to the mock functions
// ---------------------------------------------------------------------------

const mockLead = vi.mocked(Lead);

// ---------------------------------------------------------------------------
// Test helpers
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

/** Creates a NextRequest-compatible request with the given JSON body */
function makeRequest(body: object): Request {
  return new Request('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Minimal Lead document stub simulating a duplicate found in the database */
const duplicateLeadStub = {
  _id: 'stub-id',
  name: 'Test User',
  mobile: '9876543210',
  branchId: 'ln-main',
  createdAt: new Date(),
} as any;

/** Minimal Lead document stub returned by create() after a successful save */
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
// Reset mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Property 12a — Duplicate lead within 30 min returns 409
// ---------------------------------------------------------------------------

describe('Property 12a — Duplicate lead within 30 min returns 409', () => {
  it('returns 409 when Lead.findOne returns an existing lead', async () => {
    mockLead.findOne.mockResolvedValueOnce(duplicateLeadStub);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      success: false,
      error: 'We already received your enquiry. Our team will contact you shortly.',
    });
  });

  it('does not call Lead.create when a duplicate is found', async () => {
    mockLead.findOne.mockResolvedValueOnce(duplicateLeadStub);

    const request = makeRequest(validLeadBody);
    await POST(request as any);

    expect(mockLead.create).not.toHaveBeenCalled();
  });

  it('returns success=false and a non-empty error string in the 409 body', async () => {
    mockLead.findOne.mockResolvedValueOnce(duplicateLeadStub);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(typeof body.error).toBe('string');
    expect(body.error.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Property 12b — No duplicate allows lead creation (returns 201)
// ---------------------------------------------------------------------------

describe('Property 12b — No duplicate allows lead creation (returns 201)', () => {
  it('returns 201 when Lead.findOne returns null', async () => {
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('calls Lead.create once when no duplicate exists', async () => {
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const request = makeRequest(validLeadBody);
    await POST(request as any);

    expect(mockLead.create).toHaveBeenCalledOnce();
  });

  it('returns { success: true } and no error key when no duplicate', async () => {
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const request = makeRequest(validLeadBody);
    const response = await POST(request as any);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body).not.toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Property 12c — The dedup query uses the correct 30-minute time window
// ---------------------------------------------------------------------------

describe('Property 12c — Dedup query uses the correct 30-minute time window', () => {
  it('calls Lead.findOne with mobile, branchId, and createdAt.$gte ~30 min ago', async () => {
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const beforeCall = Date.now();
    const request = makeRequest(validLeadBody);
    await POST(request as any);
    const afterCall = Date.now();

    expect(mockLead.findOne).toHaveBeenCalledOnce();

    const calledWith = mockLead.findOne.mock.calls[0][0] as unknown as {
      mobile: string;
      branchId: string;
      createdAt: { $gte: Date };
    };

    // The query must include the exact mobile from the request
    expect(calledWith.mobile).toBe(validLeadBody.mobile);

    // The query must include the exact branchId from the request
    expect(calledWith.branchId).toBe(validLeadBody.branchId);

    // The query must include a createdAt.$gte Date object
    expect(calledWith.createdAt).toBeDefined();
    expect(calledWith.createdAt.$gte).toBeInstanceOf(Date);

    const gteTime = calledWith.createdAt.$gte.getTime();
    const expectedLow = beforeCall - 30 * 60 * 1000 - 1000; // 1 s tolerance
    const expectedHigh = afterCall - 30 * 60 * 1000 + 1000;

    expect(gteTime).toBeGreaterThanOrEqual(expectedLow);
    expect(gteTime).toBeLessThanOrEqual(expectedHigh);
  });

  it('the $gte timestamp is within 1 second of Date.now() - 30 minutes', async () => {
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce(createdLeadStub);

    const now = Date.now();
    const request = makeRequest(validLeadBody);
    await POST(request as any);

    const calledWith = mockLead.findOne.mock.calls[0][0] as unknown as {
      createdAt: { $gte: Date };
    };
    const gteTime = calledWith.createdAt.$gte.getTime();
    const thirtyMinutesAgo = now - 30 * 60 * 1000;

    // Must be within 1 second of exactly 30 minutes ago
    expect(Math.abs(gteTime - thirtyMinutesAgo)).toBeLessThanOrEqual(1000);
  });
});

// ---------------------------------------------------------------------------
// Property 12d — Different mobile+branchId combination is not suppressed
// ---------------------------------------------------------------------------

describe('Property 12d — Different mobile+branchId combo is not suppressed', () => {
  it('returns 201 when Lead.findOne returns null for a different combination', async () => {
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce({
      ...createdLeadStub,
      mobile: '8765432109',
      branchId: 'ln-secondary',
    });

    const differentLeadBody = {
      ...validLeadBody,
      mobile: '8765432109',
      branchId: 'ln-secondary',
    };

    const request = makeRequest(differentLeadBody);
    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('queries findOne with the exact mobile and branchId from the request body', async () => {
    mockLead.findOne.mockResolvedValueOnce(null);
    mockLead.create.mockResolvedValueOnce({
      ...createdLeadStub,
      mobile: '7654321098',
      branchId: 'ln-annex',
    });

    const differentBody = {
      ...validLeadBody,
      mobile: '7654321098',
      branchId: 'ln-annex',
    };

    const request = makeRequest(differentBody);
    await POST(request as any);

    const calledWith = mockLead.findOne.mock.calls[0][0] as unknown as {
      mobile: string;
      branchId: string;
    };
    expect(calledWith.mobile).toBe('7654321098');
    expect(calledWith.branchId).toBe('ln-annex');
  });
});
