import { describe, it, expect } from 'vitest';
import { LeadSchema, LeadUpdateSchema } from './lead';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
}

const VALID_BASE = {
  name: 'Rahul Sharma',
  mobile: '9876543210',
  whatsappOptIn: false,
  intent: 'visit' as const,
  branchId: 'branch-jaipur-1',
  source: 'enquiry-form' as const,
};

// ---------------------------------------------------------------------------
// LeadSchema — name
// ---------------------------------------------------------------------------

describe('LeadSchema › name', () => {
  it('accepts a valid name', () => {
    const result = LeadSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 chars', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('accepts name exactly 100 chars', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, name: 'A'.repeat(100) });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LeadSchema — mobile
// ---------------------------------------------------------------------------

describe('LeadSchema › mobile', () => {
  it.each(['9876543210', '8123456789', '7000000000', '6999999999'])(
    'accepts valid mobile %s',
    (mobile) => {
      const result = LeadSchema.safeParse({ ...VALID_BASE, mobile });
      expect(result.success).toBe(true);
    }
  );

  it.each([
    '5123456789', // starts with 5 — invalid
    '1234567890', // starts with 1
    '98765432',   // only 8 digits
    '987654321011', // 12 digits
    'abcdefghij', // non-numeric
    '09876543210', // 11 chars with leading 0
  ])('rejects invalid mobile %s', (mobile) => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, mobile });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LeadSchema — preferredDate
// ---------------------------------------------------------------------------

describe('LeadSchema › preferredDate', () => {
  it('is optional — passes when omitted', () => {
    const result = LeadSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
  });

  it('accepts today', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: todayUtc() });
    expect(result.success).toBe(true);
  });

  it('accepts a future date', () => {
    const future = addDays(todayUtc(), 7);
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: future });
    expect(result.success).toBe(true);
  });

  it('rejects a past date', () => {
    const yesterday = addDays(todayUtc(), -1);
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: yesterday });
    expect(result.success).toBe(false);
  });

  it('accepts an ISO date string for today', () => {
    const today = todayUtc().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: today });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid date string', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, preferredDate: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LeadSchema — whatsappOptIn
// ---------------------------------------------------------------------------

describe('LeadSchema › whatsappOptIn', () => {
  it('defaults to false when omitted', () => {
    const result = LeadSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsappOptIn).toBe(false);
  });

  it('accepts true', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, whatsappOptIn: true });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LeadSchema — intent
// ---------------------------------------------------------------------------

describe('LeadSchema › intent', () => {
  it.each(['visit', 'reserve'] as const)('accepts intent %s', (intent) => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, intent });
    expect(result.success).toBe(true);
  });

  it('rejects unknown intent', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, intent: 'other' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LeadSchema — source
// ---------------------------------------------------------------------------

describe('LeadSchema › source', () => {
  it.each(['enquiry-form', 'contact-form'] as const)('accepts source %s', (source) => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, source });
    expect(result.success).toBe(true);
  });

  it('rejects unknown source', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, source: 'admin-form' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LeadSchema — branchId
// ---------------------------------------------------------------------------

describe('LeadSchema › branchId', () => {
  it('rejects empty branchId', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, branchId: '' });
    expect(result.success).toBe(false);
  });

  it('accepts non-empty branchId', () => {
    const result = LeadSchema.safeParse({ ...VALID_BASE, branchId: 'branch-abc' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LeadUpdateSchema
// ---------------------------------------------------------------------------

describe('LeadUpdateSchema', () => {
  it.each(['new', 'contacted', 'visited', 'converted', 'closed'] as const)(
    'accepts valid status %s',
    (status) => {
      const result = LeadUpdateSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  );

  it('rejects unknown status', () => {
    const result = LeadUpdateSchema.safeParse({ status: 'archived' });
    expect(result.success).toBe(false);
  });

  it('rejects empty object', () => {
    const result = LeadUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
