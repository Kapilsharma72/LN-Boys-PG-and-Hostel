/**
 * Zod validation schemas for Lead create and update operations.
 *
 * Requirements: 9.2 (mobile regex, preferredDate refinement),
 *               9.3 (intent enum, source enum, required fields)
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the start of today (midnight) in UTC, used for the preferredDate
 * "today-or-future" refinement so that a date of "today" always passes even
 * when the visitor is in a timezone ahead of UTC.
 */
function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

// ---------------------------------------------------------------------------
// LeadSchema — used for POST /api/leads (new enquiry / contact submission)
// ---------------------------------------------------------------------------

export const LeadSchema = z.object({
  /** Full name, 1–100 characters */
  name: z
    .string()
    .min(1, 'Name must be at least 1 character')
    .max(100, 'Name must be at most 100 characters'),

  /**
   * Indian mobile number:
   *   - exactly 10 digits
   *   - first digit must be 6, 7, 8, or 9
   */
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  /**
   * Optional preferred visit / move-in date.
   * Accepts a Date object or an ISO-8601 date string (coerced to Date).
   * When provided, the date must be today or in the future.
   * Comparison is date-portion only (ignoring time).
   */
  preferredDate: z
    .coerce.date()
    .refine(
      (date) => {
        const today = startOfTodayUtc();
        // Compare date portions only: strip time from the input date
        const inputDay = new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        );
        return inputDay >= today;
      },
      { message: 'Preferred date must be today or a future date' }
    )
    .optional(),

  /** Whether the visitor wants WhatsApp updates. Defaults to false. */
  whatsappOptIn: z.boolean().default(false),

  /** Why the visitor is reaching out */
  intent: z.enum(['visit', 'reserve'] as const, {
    error: "Intent must be 'visit' or 'reserve'",
  }),

  /** Which branch the visitor is enquiring about */
  branchId: z.string().min(1, 'Branch is required'),

  /** Which form the submission came from */
  source: z.enum(['enquiry-form', 'contact-form'] as const, {
    error: "Source must be 'enquiry-form' or 'contact-form'",
  }),
});

// ---------------------------------------------------------------------------
// TypeScript types inferred from the schemas
// ---------------------------------------------------------------------------

export type LeadCreateInput = z.infer<typeof LeadSchema>;

/** @deprecated Use LeadCreateInput instead */
export type LeadInput = LeadCreateInput;

// ---------------------------------------------------------------------------
// LeadUpdateSchema — used for PATCH /api/leads/[id] (status update only)
// ---------------------------------------------------------------------------

export const LeadUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'visited', 'converted', 'closed'] as const, {
    error: 'Status must be one of: new, contacted, visited, converted, closed',
  }),
});

export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>;
