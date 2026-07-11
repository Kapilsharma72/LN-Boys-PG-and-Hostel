/**
 * Unit tests for lib/validations/branch.ts
 *
 * Covers:
 * - BranchCreateSchema: valid data, field-level error messages, edge cases
 * - BranchUpdateSchema: partial updates (all fields optional)
 * - validateBranchId(): slug format helper
 *
 * Validates requirements 1.8, 1.9, 1.10
 */

import { describe, it, expect } from 'vitest';
import {
  BranchCreateSchema,
  BranchUpdateSchema,
  validateBranchId,
} from './branch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid payload that satisfies every required field. */
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

// ---------------------------------------------------------------------------
// BranchCreateSchema — happy path
// ---------------------------------------------------------------------------

describe('BranchCreateSchema — valid data', () => {
  it('accepts a fully populated valid branch object', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      rating: 4.5,
      latitude: 26.8467,
      longitude: 75.8025,
      metaTitle: 'Best PG in Vidhani Jaipur',
      metaDescription: 'Affordable boys PG near JECRC Jaipur with meals.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a branch with only required fields', () => {
    const result = BranchCreateSchema.safeParse(validBranch);
    expect(result.success).toBe(true);
  });

  it('accepts status "coming-soon"', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      status: 'coming-soon',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null for optional nullable fields', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      latitude: null,
      longitude: null,
      metaTitle: null,
      metaDescription: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts branchId at minimum length (3 chars)', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      branchId: 'abc',
    });
    expect(result.success).toBe(true);
  });

  it('accepts branchId at maximum length (80 chars)', () => {
    const longId = 'a' + '-b'.repeat(39); // 1 + 39*2 = 79... let's make exactly 80
    // "ab" * 40 minus one char = build a valid 80-char slug
    const id80 = ('a-b').repeat(26).slice(0, 80); // ensure <= 80 and valid pattern
    // Build a known-valid 80-char slug
    const validId = 'ln-' + 'a'.repeat(77); // 80 chars, all alphanumeric after first segment
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      branchId: validId,
    });
    expect(result.success).toBe(true);
  });

  it('accepts startingPrice at exact boundary 0.01', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      startingPrice: 0.01,
    });
    expect(result.success).toBe(true);
  });

  it('accepts startingPrice at exact boundary 999999.99', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      startingPrice: 999999.99,
    });
    expect(result.success).toBe(true);
  });

  it('accepts rating at exact boundary 0.0', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      rating: 0.0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts rating at exact boundary 5.0', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      rating: 5.0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts phone array with 5 entries (maximum)', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      phone: ['1111111111', '2222222222', '3333333333', '4444444444', '5555555555'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts occupancyTypes array with 10 entries (maximum)', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      occupancyTypes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BranchCreateSchema — branchId validation (Requirement 1.8)
// ---------------------------------------------------------------------------

describe('BranchCreateSchema — branchId field', () => {
  const parse = (branchId: unknown) =>
    BranchCreateSchema.safeParse({ ...validBranch, branchId });

  it('rejects branchId shorter than 3 characters', () => {
    const result = parse('ab');
    expect(result.success).toBe(false);
  });

  it('rejects branchId longer than 80 characters', () => {
    const result = parse('a'.repeat(81));
    expect(result.success).toBe(false);
  });

  it('rejects branchId with uppercase letters', () => {
    expect(parse('LN-vidhani').success).toBe(false);
    expect(parse('Ln-vidhani').success).toBe(false);
  });

  it('rejects branchId with consecutive hyphens', () => {
    expect(parse('ln--vidhani').success).toBe(false);
  });

  it('rejects branchId that starts with a hyphen', () => {
    expect(parse('-ln-vidhani').success).toBe(false);
  });

  it('rejects branchId that ends with a hyphen', () => {
    expect(parse('ln-vidhani-').success).toBe(false);
  });

  it('rejects branchId with spaces', () => {
    expect(parse('ln vidhani').success).toBe(false);
  });

  it('rejects branchId with special characters', () => {
    expect(parse('ln_vidhani').success).toBe(false);
    expect(parse('ln.vidhani').success).toBe(false);
    expect(parse('ln@vidhani').success).toBe(false);
  });

  it('accepts branchId with only alphanumeric (no hyphens)', () => {
    expect(parse('lnvidhani').success).toBe(true);
  });

  it('accepts branchId with numbers', () => {
    expect(parse('branch1').success).toBe(true);
    expect(parse('ln-branch-2').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BranchCreateSchema — required field errors (Requirement 1.9)
// ---------------------------------------------------------------------------

describe('BranchCreateSchema — required fields (Requirement 1.9)', () => {
  it('rejects when name is missing', () => {
    const { name: _name, ...rest } = validBranch;
    const result = BranchCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects when name is empty string', () => {
    const result = BranchCreateSchema.safeParse({ ...validBranch, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'));
      expect(nameError).toBeDefined();
    }
  });

  it('rejects when address is missing', () => {
    const { address: _address, ...rest } = validBranch;
    const result = BranchCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects when phone array is empty', () => {
    const result = BranchCreateSchema.safeParse({ ...validBranch, phone: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const phoneError = result.error.issues.find((i) => i.path.includes('phone'));
      expect(phoneError).toBeDefined();
    }
  });

  it('rejects when phone array has more than 5 entries', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      phone: ['1', '2', '3', '4', '5', '6'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects when status is missing', () => {
    const { status: _status, ...rest } = validBranch;
    const result = BranchCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects when status is an invalid enum value', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      status: 'inactive',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const statusError = result.error.issues.find((i) => i.path.includes('status'));
      expect(statusError).toBeDefined();
    }
  });

  it('returns a field-level error path for invalid fields', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      name: '',
      pincode: '12345', // too short
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('name');
      expect(paths).toContain('pincode');
    }
  });
});

// ---------------------------------------------------------------------------
// BranchCreateSchema — pincode validation
// ---------------------------------------------------------------------------

describe('BranchCreateSchema — pincode field', () => {
  const parse = (pincode: unknown) =>
    BranchCreateSchema.safeParse({ ...validBranch, pincode });

  it('accepts exactly 6 digit pincode', () => {
    expect(parse('302017').success).toBe(true);
    expect(parse('000000').success).toBe(true);
    expect(parse('999999').success).toBe(true);
  });

  it('rejects 5-digit pincode', () => {
    expect(parse('30201').success).toBe(false);
  });

  it('rejects 7-digit pincode', () => {
    expect(parse('3020170').success).toBe(false);
  });

  it('rejects pincode with letters', () => {
    expect(parse('30201A').success).toBe(false);
  });

  it('rejects pincode with spaces', () => {
    expect(parse('302 017').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BranchCreateSchema — numeric field boundaries
// ---------------------------------------------------------------------------

describe('BranchCreateSchema — startingPrice boundaries', () => {
  const parse = (startingPrice: unknown) =>
    BranchCreateSchema.safeParse({ ...validBranch, startingPrice });

  it('rejects startingPrice below 0.01', () => {
    expect(parse(0).success).toBe(false);
    expect(parse(-1).success).toBe(false);
  });

  it('rejects startingPrice above 999999.99', () => {
    expect(parse(1000000).success).toBe(false);
  });
});

describe('BranchCreateSchema — rating boundaries', () => {
  const parse = (rating: unknown) =>
    BranchCreateSchema.safeParse({ ...validBranch, rating });

  it('rejects rating below 0.0', () => {
    expect(parse(-0.1).success).toBe(false);
  });

  it('rejects rating above 5.0', () => {
    expect(parse(5.1).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BranchCreateSchema — string length fields
// ---------------------------------------------------------------------------

describe('BranchCreateSchema — string length constraints', () => {
  it('rejects name longer than 120 chars', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      name: 'a'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it('rejects address longer than 300 chars', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      address: 'a'.repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it('rejects city longer than 60 chars', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      city: 'a'.repeat(61),
    });
    expect(result.success).toBe(false);
  });

  it('rejects state longer than 60 chars', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      state: 'a'.repeat(61),
    });
    expect(result.success).toBe(false);
  });

  it('rejects metaTitle longer than 70 chars', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      metaTitle: 'a'.repeat(71),
    });
    expect(result.success).toBe(false);
  });

  it('rejects metaDescription longer than 160 chars', () => {
    const result = BranchCreateSchema.safeParse({
      ...validBranch,
      metaDescription: 'a'.repeat(161),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BranchUpdateSchema — all fields optional (Requirement 1.10 / PATCH)
// ---------------------------------------------------------------------------

describe('BranchUpdateSchema — partial updates', () => {
  it('accepts an empty object (no fields required)', () => {
    const result = BranchUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts updating only the name', () => {
    const result = BranchUpdateSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('accepts updating only the status', () => {
    const result = BranchUpdateSchema.safeParse({ status: 'coming-soon' });
    expect(result.success).toBe(true);
  });

  it('still enforces field constraints when a field is provided', () => {
    const result = BranchUpdateSchema.safeParse({ pincode: '12345' }); // invalid 5-digit
    expect(result.success).toBe(false);
  });

  it('still rejects an invalid branchId if provided', () => {
    const result = BranchUpdateSchema.safeParse({ branchId: 'INVALID_SLUG' });
    expect(result.success).toBe(false);
  });

  it('accepts a full valid branch object (same as create)', () => {
    const result = BranchUpdateSchema.safeParse(validBranch);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateBranchId helper
// ---------------------------------------------------------------------------

describe('validateBranchId()', () => {
  // Valid slugs
  it('returns true for a simple lowercase word', () => {
    expect(validateBranchId('vidhani')).toBe(true);
  });

  it('returns true for a hyphenated slug', () => {
    expect(validateBranchId('ln-vidhani')).toBe(true);
  });

  it('returns true for a slug with numbers', () => {
    expect(validateBranchId('branch1')).toBe(true);
    expect(validateBranchId('ln-branch-2')).toBe(true);
  });

  it('returns true for exactly 3 characters', () => {
    expect(validateBranchId('abc')).toBe(true);
  });

  it('returns true for exactly 80 characters', () => {
    // "a-b" repeated fills exactly 80: 1 + 2*39 = 79, need 80
    const slug = 'a' + '-b'.repeat(39) + 'c'; // 1+78+1 = 80 chars — check pattern validity
    // Actually let's build it properly: "ln" + "-x" * 39 = 2 + 78 = 80
    const id80 = 'ln' + '-x'.repeat(39); // length = 2 + 78 = 80
    expect(id80.length).toBe(80);
    expect(validateBranchId(id80)).toBe(true);
  });

  // Invalid slugs
  it('returns false for fewer than 3 characters', () => {
    expect(validateBranchId('ab')).toBe(false);
    expect(validateBranchId('a')).toBe(false);
    expect(validateBranchId('')).toBe(false);
  });

  it('returns false for more than 80 characters', () => {
    const tooLong = 'a'.repeat(81);
    expect(validateBranchId(tooLong)).toBe(false);
  });

  it('returns false for uppercase letters', () => {
    expect(validateBranchId('LN-vidhani')).toBe(false);
    expect(validateBranchId('Vidhani')).toBe(false);
  });

  it('returns false for leading hyphen', () => {
    expect(validateBranchId('-ln-vidhani')).toBe(false);
  });

  it('returns false for trailing hyphen', () => {
    expect(validateBranchId('ln-vidhani-')).toBe(false);
  });

  it('returns false for consecutive hyphens', () => {
    expect(validateBranchId('ln--vidhani')).toBe(false);
  });

  it('returns false for spaces', () => {
    expect(validateBranchId('ln vidhani')).toBe(false);
  });

  it('returns false for underscores', () => {
    expect(validateBranchId('ln_vidhani')).toBe(false);
  });

  it('returns false for dots', () => {
    expect(validateBranchId('ln.vidhani')).toBe(false);
  });

  it('returns false for special characters', () => {
    expect(validateBranchId('ln@vidhani')).toBe(false);
    expect(validateBranchId('ln/vidhani')).toBe(false);
  });
});
