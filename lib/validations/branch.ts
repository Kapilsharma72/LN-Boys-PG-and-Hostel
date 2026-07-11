/**
 * Zod validation schemas for Branch create and update operations.
 *
 * Requirements: 1.8 (branchId uniqueness and slug format),
 *               1.9 (required field validation with field-level errors),
 *               1.10 (server-side constraint errors → HTTP 422)
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Regex constants — mirrors the Mongoose schema constraints exactly
// ---------------------------------------------------------------------------

/** URL-safe slug: lowercase alphanumeric words joined by single hyphens. */
const BRANCH_ID_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Exactly 6 decimal digits (Indian pincode). */
const PINCODE_REGEX = /^\d{6}$/;

// ---------------------------------------------------------------------------
// BranchCreateSchema — full schema used when creating a new Branch document
// ---------------------------------------------------------------------------

export const BranchCreateSchema = z.object({
  /** Unique URL-safe slug, 3–80 characters. */
  branchId: z
    .string()
    .min(3, 'branchId must be at least 3 characters')
    .max(80, 'branchId must be at most 80 characters')
    .regex(BRANCH_ID_REGEX, 'branchId must be lowercase alphanumeric with hyphens only (e.g. ln-vidhani)'),

  /** Display name, 1–120 characters. */
  name: z
    .string()
    .min(1, 'name is required')
    .max(120, 'name must be at most 120 characters'),

  /** Street address, 1–300 characters. */
  address: z
    .string()
    .min(1, 'address is required')
    .max(300, 'address must be at most 300 characters'),

  /** City name, 1–60 characters. */
  city: z
    .string()
    .min(1, 'city is required')
    .max(60, 'city must be at most 60 characters'),

  /** State name, 1–60 characters. */
  state: z
    .string()
    .min(1, 'state is required')
    .max(60, 'state must be at most 60 characters'),

  /** Indian pincode — exactly 6 digits. */
  pincode: z
    .string()
    .regex(PINCODE_REGEX, 'pincode must be exactly 6 digits'),

  /** Contact phone numbers — 1 to 5 entries. */
  phone: z
    .array(z.string().min(1, 'each phone entry must be non-empty'))
    .min(1, 'at least one phone number is required')
    .max(5, 'at most 5 phone numbers are allowed'),

  /** WhatsApp contact number. */
  whatsapp: z
    .string()
    .min(1, 'whatsapp is required'),

  /** Starting price in INR per month. */
  startingPrice: z
    .number()
    .min(0.01, 'startingPrice must be at least 0.01')
    .max(999999.99, 'startingPrice must be at most 999999.99'),

  /** Aggregate rating, 0.0–5.0 (optional, defaults to 0 in DB). */
  rating: z
    .number()
    .min(0.0, 'rating must be at least 0.0')
    .max(5.0, 'rating must be at most 5.0')
    .optional(),

  /** Publication status. */
  status: z.enum(['active', 'coming-soon'], {
    error: "status must be 'active' or 'coming-soon'",
  }),

  /** List of offered occupancy types — 1 to 10 entries. */
  occupancyTypes: z
    .array(z.string().min(1, 'each occupancy type must be non-empty'))
    .min(1, 'at least one occupancy type is required')
    .max(10, 'at most 10 occupancy types are allowed'),

  /** GPS latitude (optional, null means unknown). */
  latitude: z.number().nullable().optional(),

  /** GPS longitude (optional, null means unknown). */
  longitude: z.number().nullable().optional(),

  /** SEO meta title — 1–70 characters (optional, null allowed). */
  metaTitle: z
    .string()
    .min(1, 'metaTitle must be at least 1 character')
    .max(70, 'metaTitle must be at most 70 characters')
    .nullable()
    .optional(),

  /** SEO meta description — 1–160 characters (optional, null allowed). */
  metaDescription: z
    .string()
    .min(1, 'metaDescription must be at least 1 character')
    .max(160, 'metaDescription must be at most 160 characters')
    .nullable()
    .optional(),
});

// ---------------------------------------------------------------------------
// BranchUpdateSchema — partial version used for PATCH operations
// All fields become optional so callers only send what changed.
// ---------------------------------------------------------------------------

export const BranchUpdateSchema = BranchCreateSchema.partial();

// ---------------------------------------------------------------------------
// TypeScript types inferred from the schemas
// ---------------------------------------------------------------------------

export type BranchCreateInput = z.infer<typeof BranchCreateSchema>;
export type BranchUpdateInput = z.infer<typeof BranchUpdateSchema>;

// ---------------------------------------------------------------------------
// validateBranchId — lightweight helper that checks the slug regex
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the given string is a valid branch slug:
 * - lowercase alphanumeric segments only
 * - segments joined by single hyphens
 * - length between 3 and 80 characters
 *
 * Example valid values: "ln-vidhani", "ln-vidhani-jecrc", "branch1"
 * Example invalid values: "LN-Vidhani", "ln--vidhani", "-ln", "ln-"
 */
export function validateBranchId(id: string): boolean {
  if (id.length < 3 || id.length > 80) return false;
  return BRANCH_ID_REGEX.test(id);
}
