'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * EnquiryForm — "Schedule a Visit / Reserve Now" form.
 *
 * Client Component.
 * Requirements: 9.1, 9.2, 9.7, 9.8, 9.9
 *
 * State machine:
 *   idle → submitting (valid submit) → success (reset + banner) | error (preserve values)
 *   Duplicate lead (409) → show dedup message WITHOUT resetting fields
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Format a Date as YYYY-MM-DD for <input type="date"> min attribute */
function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Zod schema (client-side subset — no branchId/source, those are injected)
// ---------------------------------------------------------------------------

type Intent = 'visit' | 'reserve';

/**
 * We build the schema dynamically so that `preferredDate` is required only in
 * "Schedule a Visit" (intent === 'visit') mode.
 */
function buildSchema(intent: Intent) {
  const base = z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters'),

    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),

    whatsappOptIn: z.boolean().default(false),

    termsAccepted: z
      .boolean()
      .refine((v) => v === true, {
        message: 'You must accept the Terms & Conditions to proceed',
      }),
  });

  if (intent === 'visit') {
    return base.extend({
      preferredDate: z
        .string()
        .min(1, 'Preferred date is required')
        .refine(
          (val) => {
            const selected = new Date(val + 'T00:00:00');
            return selected >= startOfTodayLocal();
          },
          { message: 'Preferred date must be today or a future date' }
        ),
    });
  }

  // "reserve" mode — preferredDate not required / not visible
  return base.extend({
    preferredDate: z.string().optional(),
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VisitFormValues = {
  name: string;
  mobile: string;
  preferredDate: string;
  whatsappOptIn: boolean;
  termsAccepted: boolean;
};

type ReserveFormValues = {
  name: string;
  mobile: string;
  preferredDate?: string;
  whatsappOptIn: boolean;
  termsAccepted: boolean;
};

type FormValues = VisitFormValues | ReserveFormValues;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EnquiryFormProps {
  branchId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EnquiryForm({ branchId }: EnquiryFormProps) {
  const [intent, setIntent] = useState<Intent>('visit');
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(buildSchema(intent)) as any,
    defaultValues: {
      name: '',
      mobile: '',
      preferredDate: '',
      whatsappOptIn: false,
      termsAccepted: false,
    },
    mode: 'onBlur',
  });

  // -------------------------------------------------------------------------
  // Intent toggle — switch modes without losing field values
  // -------------------------------------------------------------------------
  const handleIntentChange = useCallback(
    (next: Intent) => {
      if (next === intent) return;
      setIntent(next);
      // Clear error/success state when user switches mode
      setFormStatus('idle');
      setErrorMessage('');
    },
    [intent]
  );

  // -------------------------------------------------------------------------
  // Non-numeric input rejection on Mobile field (requirement 9.2)
  // -------------------------------------------------------------------------
  const handleMobileKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: Backspace, Delete, Tab, Escape, Enter, Arrow keys, Home, End
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End',
      ];
      if (allowedKeys.includes(e.key)) return;
      // Allow: Ctrl/Cmd + A, C, V, X, Z
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
      // Strip any non-numeric characters that may have been pasted
      const input = e.currentTarget;
      const cleaned = input.value.replace(/\D/g, '');
      if (input.value !== cleaned) {
        input.value = cleaned;
        // Trigger a synthetic input event so react-hook-form sees the update
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
  const onSubmit = async (data: FormValues) => {
    setFormStatus('submitting');
    setErrorMessage('');

    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        mobile: data.mobile,
        whatsappOptIn: data.whatsappOptIn,
        intent: intent === 'visit' ? 'visit' : 'reserve',
        branchId,
        source: 'enquiry-form',
      };

      if (intent === 'visit' && (data as VisitFormValues).preferredDate) {
        payload.preferredDate = (data as VisitFormValues).preferredDate;
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setFormStatus('success');
        reset(); // reset to defaults on success (requirement 9.3)
        return;
      }

      if (res.status === 409) {
        // Duplicate lead — show message WITHOUT resetting fields (requirement 9.4)
        setFormStatus('error');
        setErrorMessage(
          'We already received your enquiry. Our team will contact you shortly.'
        );
        return;
      }

      // Any other error
      setFormStatus('error');
      setErrorMessage(
        json.error ?? 'Something went wrong. Please try again.'
      );
    } catch {
      setFormStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const isSubmitting = formStatus === 'submitting';
  const todayStr = toDateInputValue(startOfTodayLocal());

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <form
      onSubmit={handleSubmit(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSubmit as any
      )}
      noValidate
      aria-label="Enquiry form"
      className="space-y-5"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Intent toggle                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        role="group"
        aria-label="Enquiry type"
        className="flex rounded-lg overflow-hidden border border-white/20"
      >
        {(
          [
            { value: 'visit', label: 'Schedule a Visit' },
            { value: 'reserve', label: 'Reserve Now' },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={intent === value}
            onClick={() => handleIntentChange(value)}
            className={[
              'flex-1 py-2.5 px-3 text-sm font-semibold transition-colors duration-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
              intent === value
                ? 'bg-[#F5C518] text-[#0B0B3B]'
                : 'bg-white/5 text-gray-300 hover:bg-white/10',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Success banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      {formStatus === 'success' && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-lg bg-green-900/40 border border-green-700 text-green-300 text-sm"
        >
          Your enquiry has been received! Our team will contact you within 2 hours.
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Error / dedup banner                                                 */}
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
          htmlFor="enquiry-name"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Name <span aria-hidden="true" className="text-red-400">*</span>
        </label>
        <input
          id="enquiry-name"
          type="text"
          autoComplete="name"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'enquiry-name-error' : undefined}
          disabled={isSubmitting}
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
            id="enquiry-name-error"
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
          htmlFor="enquiry-mobile"
          className="block text-sm font-medium text-gray-300 mb-1"
        >
          Mobile <span aria-hidden="true" className="text-red-400">*</span>
        </label>
        <input
          id="enquiry-mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          aria-required="true"
          aria-invalid={!!errors.mobile}
          aria-describedby={errors.mobile ? 'enquiry-mobile-error' : undefined}
          disabled={isSubmitting}
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
            id="enquiry-mobile-error"
            role="alert"
            className="mt-1 text-xs text-red-400"
          >
            {errors.mobile.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Preferred Date — visible only in "Schedule a Visit" mode             */}
      {/* ------------------------------------------------------------------ */}
      {intent === 'visit' && (
        <div>
          <label
            htmlFor="enquiry-date"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Preferred Date <span aria-hidden="true" className="text-red-400">*</span>
          </label>
          <input
            id="enquiry-date"
            type="date"
            min={todayStr}
            aria-required="true"
            aria-invalid={!!(errors as { preferredDate?: { message?: string } }).preferredDate}
            aria-describedby={
              (errors as { preferredDate?: { message?: string } }).preferredDate
                ? 'enquiry-date-error'
                : undefined
            }
            disabled={isSubmitting}
            className={[
              'w-full px-4 py-2.5 rounded-lg bg-white/10 border text-white',
              'focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              '[color-scheme:dark]',
              (errors as { preferredDate?: { message?: string } }).preferredDate
                ? 'border-red-500'
                : 'border-white/20',
            ].join(' ')}
            {...register('preferredDate')}
          />
          {(errors as { preferredDate?: { message?: string } }).preferredDate && (
            <p
              id="enquiry-date-error"
              role="alert"
              className="mt-1 text-xs text-red-400"
            >
              {(errors as { preferredDate?: { message?: string } }).preferredDate?.message}
            </p>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* WhatsApp opt-in checkbox                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start gap-3">
        <Controller
          name="whatsappOptIn"
          control={control}
          render={({ field }) => (
            <input
              id="enquiry-whatsapp"
              type="checkbox"
              disabled={isSubmitting}
              checked={field.value as boolean}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              className={[
                'mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10',
                'checked:bg-[#F5C518] checked:border-[#F5C518]',
                'focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-0',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'accent-[#F5C518] cursor-pointer',
              ].join(' ')}
            />
          )}
        />
        <label
          htmlFor="enquiry-whatsapp"
          className="text-sm text-gray-300 leading-snug cursor-pointer"
        >
          Send me updates on WhatsApp
        </label>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Terms & Conditions checkbox (required)                               */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-start gap-3">
          <Controller
            name="termsAccepted"
            control={control}
            render={({ field }) => (
              <input
                id="enquiry-terms"
                type="checkbox"
                disabled={isSubmitting}
                checked={field.value as boolean}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-required="true"
                aria-invalid={!!(errors as { termsAccepted?: { message?: string } }).termsAccepted}
                aria-describedby={
                  (errors as { termsAccepted?: { message?: string } }).termsAccepted
                    ? 'enquiry-terms-error'
                    : undefined
                }
                className={[
                  'mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10',
                  'checked:bg-[#F5C518] checked:border-[#F5C518]',
                  'focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-0',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'accent-[#F5C518] cursor-pointer',
                  (errors as { termsAccepted?: { message?: string } }).termsAccepted
                    ? 'border-red-500'
                    : '',
                ].join(' ')}
              />
            )}
          />
          <label
            htmlFor="enquiry-terms"
            className="text-sm text-gray-300 leading-snug cursor-pointer"
          >
            I accept the{' '}
            <a
              href="/policies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F5C518] underline hover:text-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F5C518]"
            >
              Terms &amp; Conditions
            </a>{' '}
            <span aria-hidden="true" className="text-red-400">*</span>
          </label>
        </div>
        {(errors as { termsAccepted?: { message?: string } }).termsAccepted && (
          <p
            id="enquiry-terms-error"
            role="alert"
            className="mt-1 text-xs text-red-400"
          >
            {(errors as { termsAccepted?: { message?: string } }).termsAccepted?.message}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Submit button                                                        */}
      {/* ------------------------------------------------------------------ */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-disabled={isSubmitting}
        className={[
          'w-full py-3 px-6 rounded-lg font-bold text-[#0B0B3B] transition-colors duration-200',
          'flex items-center justify-center gap-2',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          isSubmitting
            ? 'bg-yellow-300 cursor-not-allowed opacity-70'
            : 'bg-[#F5C518] hover:bg-yellow-400',
        ].join(' ')}
      >
        {isSubmitting ? (
          <>
            {/* Spinner — requirement 9.9 */}
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
            <span>Submitting…</span>
          </>
        ) : intent === 'visit' ? (
          'Schedule My Visit'
        ) : (
          'Reserve My Spot'
        )}
      </button>
    </form>
  );
}
