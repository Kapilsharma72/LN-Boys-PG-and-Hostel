'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * ContactForm — controlled form for the Contact Us page.
 *
 * Client Component.
 * Requirements: 6.2, 6.3, 6.4, 6.5
 *
 * State machine:
 *   idle → submitting (valid submit) → success (banner shown, fields preserved until
 *     next interaction) | error (inline error, fields fully preserved)
 *
 * Field validation modes:
 *   - Name, Mobile, Message: onBlur (per requirement 6.5)
 *   - Branch dropdown: onChange (per requirement 6.5) — validated via Controller
 *     onChange + explicit trigger call to ensure immediate feedback on selection
 *
 * On success:
 *   - Display success banner inline WITHOUT navigating away (requirement 6.3)
 *   - Do NOT reset form fields (requirement 6.3 — "until next interaction")
 *   - Fields remain populated so the visitor can see what they submitted
 *
 * On network / DB error:
 *   - Display "Something went wrong. Please try again." (requirement 6.4)
 *   - Preserve all field values (requirement 6.4)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Branch {
  branchId: string;
  name: string;
}

export interface ContactFormProps {
  /** Active branches to populate the dropdown. Fetched and passed from the parent page. */
  activeBranches: Branch[];
}

// ---------------------------------------------------------------------------
// Zod schema (client-side validation only — message field is UI-only)
// ---------------------------------------------------------------------------

const ContactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),

  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

  /** Optional — empty string means no branch selected */
  branchId: z.string().optional(),

  /** Optional, 0–500 characters (UI-only, API ignores it) */
  message: z
    .string()
    .max(500, 'Message must be at most 500 characters')
    .optional(),
});

type ContactFormValues = z.infer<typeof ContactSchema>;

// ---------------------------------------------------------------------------
// Form state machine
// ---------------------------------------------------------------------------

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContactForm({ activeBranches }: ContactFormProps) {
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
    // NOTE: We intentionally do NOT call reset() on success per requirement 6.3:
    // "display a success confirmation message inline on the form without navigating
    //  away from the page" — field values are preserved until next interaction.
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      name: '',
      mobile: '',
      branchId: '',
      message: '',
    },
    // Text inputs validate on blur; dropdown validates on change (see Controller below).
    mode: 'onBlur',
  });

  // -------------------------------------------------------------------------
  // Mobile — reject non-numeric keystrokes (requirement 6.2 via 9.2 pattern)
  // -------------------------------------------------------------------------

  const handleMobileKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End',
      ];
      if (allowedKeys.includes(e.key)) return;
      // Allow Ctrl/Cmd shortcuts (select-all, copy, paste, cut, undo)
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;
      // Block any non-digit
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    },
    []
  );

  const handleMobileInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      // Strip non-numeric characters that may have been pasted
      const input = e.currentTarget;
      const cleaned = input.value.replace(/\D/g, '');
      if (input.value !== cleaned) {
        // Use native setter to trigger React's synthetic event system
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(input, cleaned);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const onSubmit = async (data: ContactFormValues) => {
    setFormStatus('submitting');
    setErrorMessage('');

    try {
      // branchId is optional in the form but required by the API.
      // When not selected, fall back to 'general' as a placeholder.
      const resolvedBranchId = data.branchId || 'general';

      const payload = {
        name: data.name,
        mobile: data.mobile,
        branchId: resolvedBranchId,
        intent: 'visit' as const,
        source: 'contact-form' as const,
        whatsappOptIn: false,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let json: { success?: boolean; error?: string } = {};
      try {
        json = await res.json();
      } catch {
        // Malformed JSON — treat as server error
      }

      if (res.ok && json.success) {
        // Show success banner; do NOT reset fields (requirement 6.3)
        setFormStatus('success');

        // Also open WhatsApp with pre-filled message
        const branchName = activeBranches.find(b => b.branchId === data.branchId)?.name ?? 'LN Boys PG';
        const msg = `Hi LN Boys PG! 👋\n\nMera naam *${data.name}* hai.\nMobile: *${data.mobile}*\nBranch: *${branchName}*${data.message ? `\nMessage: ${data.message}` : ''}\n\nMujhe aapke PG ke baare mein jaankari chahiye.`;
        window.open(`https://wa.me/918385857902?text=${encodeURIComponent(msg)}`, '_blank');
        return;
      }

      if (res.status === 409) {
        // Duplicate lead within 30-min window — preserve fields
        setFormStatus('error');
        setErrorMessage(
          json.error ?? 'We already received your enquiry. Our team will contact you shortly.'
        );
        return;
      }

      // Any other error (400, 429, 500, etc.) — preserve fields (requirement 6.4)
      setFormStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    } catch {
      // Network error — preserve fields (requirement 6.4)
      setFormStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const isSubmitting = formStatus === 'submitting';

  // When success banner is shown, allow re-submission (the banner doesn't lock the form)
  const isDisabled = isSubmitting;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Contact form"
      className="space-y-5"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Success banner — shown inline; fields remain populated              */}
      {/* ------------------------------------------------------------------ */}
      {formStatus === 'success' && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-lg bg-green-900/40 border border-green-700 text-green-300 text-sm"
        >
          ✓ Message received! WhatsApp window bhi open hui hai — wahan bhi baat kar sakte hain.
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error / duplicate banner — fields stay populated                    */}
      {/* ------------------------------------------------------------------ */}
      {formStatus === 'error' && errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm"
        >
          {errorMessage}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Name                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Name{' '}
          <span aria-hidden="true" className="text-red-400">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          disabled={isDisabled}
          placeholder="Your full name"
          className={[
            'w-full px-4 py-2.5 rounded-lg bg-white/10 border text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            errors.name ? 'border-red-500' : 'border-white/20',
          ].join(' ')}
          {...register('name')}
        />
        {errors.name && (
          <p
            id="contact-name-error"
            role="alert"
            className="mt-1 text-xs text-red-400"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="contact-mobile"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Mobile{' '}
          <span aria-hidden="true" className="text-red-400">*</span>
        </label>
        <input
          id="contact-mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          aria-required="true"
          aria-invalid={!!errors.mobile}
          aria-describedby={errors.mobile ? 'contact-mobile-error' : undefined}
          disabled={isDisabled}
          placeholder="10-digit mobile number"
          className={[
            'w-full px-4 py-2.5 rounded-lg bg-white/10 border text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            errors.mobile ? 'border-red-500' : 'border-white/20',
          ].join(' ')}
          {...register('mobile')}
          onKeyDown={handleMobileKeyDown}
          onInput={handleMobileInput}
        />
        {errors.mobile && (
          <p
            id="contact-mobile-error"
            role="alert"
            className="mt-1 text-xs text-red-400"
          >
            {errors.mobile.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Branch of interest — optional dropdown, active branches only        */}
      {/* Always rendered; validates onChange (requirement 6.5)               */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="contact-branch"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Branch of interest{' '}
          <span className="text-gray-500 font-normal text-xs">(optional)</span>
        </label>
        <Controller
          name="branchId"
          control={control}
          render={({ field }) => (
            <select
              id="contact-branch"
              aria-label="Branch of interest"
              aria-invalid={!!errors.branchId}
              aria-describedby={errors.branchId ? 'contact-branch-error' : undefined}
              disabled={isDisabled || activeBranches.length === 0}
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e);
                // Explicitly trigger re-validation on change (requirement 6.5):
                // the branch dropdown must validate immediately on selection, not on blur.
                void trigger('branchId');
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              className={[
                'w-full px-4 py-2.5 rounded-lg bg-[#0B0B3B] border text-white',
                'focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                '[color-scheme:dark]',
                errors.branchId ? 'border-red-500' : 'border-white/20',
              ].join(' ')}
            >
              <option value="">
                {activeBranches.length === 0
                  ? 'No active branches available'
                  : 'Select a branch (optional)'}
              </option>
              {activeBranches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.name}
                </option>
              ))}
            </select>
          )}
        />
        {errors.branchId && (
          <p
            id="contact-branch-error"
            role="alert"
            className="mt-1 text-xs text-red-400"
          >
            {errors.branchId.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Message — optional, 0–500 characters                                */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Message{' '}
          <span className="text-gray-500 font-normal text-xs">(optional)</span>
        </label>
        <textarea
          id="contact-message"
          rows={4}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          disabled={isDisabled}
          placeholder="Any specific questions or requirements?"
          className={[
            'w-full px-4 py-2.5 rounded-lg bg-white/10 border text-white placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent',
            'disabled:opacity-60 disabled:cursor-not-allowed resize-none',
            errors.message ? 'border-red-500' : 'border-white/20',
          ].join(' ')}
          {...register('message')}
        />
        {errors.message && (
          <p
            id="contact-message-error"
            role="alert"
            className="mt-1 text-xs text-red-400"
          >
            {errors.message.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Submit button — spinner during flight (requirement 9.9 pattern)     */}
      {/* ------------------------------------------------------------------ */}
      <button
        type="submit"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={[
          'w-full py-3 px-6 rounded-lg font-bold text-[#0B0B3B] transition-colors duration-200',
          'flex items-center justify-center gap-2',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          isDisabled
            ? 'bg-yellow-300 cursor-not-allowed opacity-70'
            : 'bg-[#F5C518] hover:bg-yellow-400',
        ].join(' ')}
      >
        {isSubmitting ? (
          <>
            <svg
              aria-hidden="true"
              className="h-5 w-5 animate-spin text-[#0B0B3B]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Sending…</span>
          </>
        ) : (
          'Send Message'
        )}
      </button>
    </form>
  );
}
