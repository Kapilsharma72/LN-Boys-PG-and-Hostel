'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * PoliciesManager (Client Component)
 *
 * Task 20.7 — CRUD policies with `order` field and reorder UI.
 *
 * Requirements: 1.6
 *
 * Features:
 * - List policies sorted by `order` ascending
 * - Add/Edit form with react-hook-form + Zod client-side validation
 * - Field-level errors for title, body, and order
 * - Move-up / move-down buttons to reorder policies (swap `order` values)
 * - Delete with inline confirm/cancel pattern
 * - All mutations use X-CSRF-Token header
 * - Loading states with spinners; errors preserve field values (req 1.10)
 */

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const PolicyFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),
  body: z
    .string()
    .min(1, 'Body is required')
    .max(5000, 'Body must be at most 5000 characters'),
  order: z
    .number({ error: 'Order must be a number' })
    .int('Order must be a whole number')
    .min(0, 'Order must be 0 or greater'),
});

type PolicyFormValues = z.infer<typeof PolicyFormSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PolicyRow {
  _id: string;
  branchId: string;
  title: string;
  body: string;
  order: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean): string {
  return [
    'w-full px-3 py-2 rounded-lg border text-sm text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-[#0B0B3B] focus:border-transparent',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    hasError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
  ].join(' ');
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PolicyForm — create or edit a single policy
// ---------------------------------------------------------------------------

interface PolicyFormProps {
  branchId: string;
  mode: 'create' | 'edit';
  policyId?: string;
  defaultValues?: Partial<PolicyFormValues>;
  onSuccess: () => void;
  onCancel: () => void;
}

function PolicyForm({ branchId, mode, policyId, defaultValues, onSuccess, onCancel }: PolicyFormProps) {
  const csrfToken = useCsrfToken();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PolicyFormValues>({
    resolver: zodResolver(PolicyFormSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      body: defaultValues?.body ?? '',
      order: defaultValues?.order ?? 0,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: PolicyFormValues) => {
    if (!csrfToken) {
      setServerError('Missing CSRF token. Please log in again.');
      return;
    }
    setServerError(null);

    const url =
      mode === 'create'
        ? `/api/branches/${branchId}/policies`
        : `/api/branches/${branchId}/policies/${policyId}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        onSuccess();
        return;
      }
      // Show server error without clearing form values (per req 1.10)
      setServerError(json.error ?? 'An error occurred. Please try again.');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Add policy form' : 'Edit policy form'}
      className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
    >
      <h3 className="text-sm font-semibold text-gray-700">
        {mode === 'create' ? 'Add New Policy' : 'Edit Policy'}
      </h3>

      {/* Server error banner */}
      {serverError && (
        <div role="alert" aria-live="assertive" className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Title */}
        <div className="sm:col-span-3">
          <label htmlFor={`policy-title-${mode}`} className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`policy-title-${mode}`}
            type="text"
            maxLength={120}
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? `policy-title-${mode}-error` : undefined}
            disabled={isSubmitting}
            placeholder="e.g. Guest Policy"
            className={inputClass(!!errors.title)}
            {...register('title')}
          />
          {errors.title && (
            <p id={`policy-title-${mode}-error`} role="alert" className="mt-1 text-xs text-red-600">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Order */}
        <div>
          <label htmlFor={`policy-order-${mode}`} className="block text-sm font-medium text-gray-700 mb-1">
            Order <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`policy-order-${mode}`}
            type="number"
            min={0}
            step={1}
            aria-required="true"
            aria-invalid={!!errors.order}
            aria-describedby={errors.order ? `policy-order-${mode}-error` : undefined}
            disabled={isSubmitting}
            className={inputClass(!!errors.order)}
            {...register('order', { valueAsNumber: true })}
          />
          {errors.order && (
            <p id={`policy-order-${mode}-error`} role="alert" className="mt-1 text-xs text-red-600">
              {errors.order.message}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div>
        <label htmlFor={`policy-body-${mode}`} className="block text-sm font-medium text-gray-700 mb-1">
          Body <span className="text-red-500" aria-hidden="true">*</span>
          <span className="text-xs text-gray-400 font-normal ml-1">(up to 5000 characters)</span>
        </label>
        <textarea
          id={`policy-body-${mode}`}
          rows={5}
          maxLength={5000}
          aria-required="true"
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? `policy-body-${mode}-error` : undefined}
          disabled={isSubmitting}
          placeholder="Describe the policy in detail…"
          className={`${inputClass(!!errors.body)} resize-y min-h-[80px]`}
          {...register('body')}
        />
        {errors.body && (
          <p id={`policy-body-${mode}-error`} role="alert" className="mt-1 text-xs text-red-600">
            {errors.body.message}
          </p>
        )}
      </div>

      {/* Form actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className={[
            'inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-[#0B0B3B] transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]',
            isSubmitting ? 'bg-yellow-300 cursor-not-allowed opacity-70' : 'bg-[#F5C518] hover:bg-yellow-400',
          ].join(' ')}
        >
          {isSubmitting ? (
            <><Spinner />Saving…</>
          ) : mode === 'create' ? 'Add Policy' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// PoliciesManager — main exported component
// ---------------------------------------------------------------------------

interface PoliciesManagerProps {
  branchId: string;
  initialPolicies: PolicyRow[];
}

type UIState =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'edit'; policy: PolicyRow };

export default function PoliciesManager({ branchId, initialPolicies }: PoliciesManagerProps) {
  const router = useRouter();
  const csrfToken = useCsrfToken();

  // Sort by order ascending
  const [policies, setPolicies] = useState<PolicyRow[]>(
    [...initialPolicies].sort((a, b) => a.order - b.order)
  );
  const [uiState, setUiState] = useState<UIState>({ mode: 'list' });

  // Per-row loading / error state
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Refresh from server
  // -------------------------------------------------------------------------

  const refreshPolicies = async () => {
    try {
      const res = await fetch(`/api/branches/${branchId}/policies`);
      const json = await res.json();
      if (res.ok && json.success) {
        setPolicies([...(json.data as PolicyRow[])].sort((a, b) => a.order - b.order));
      }
    } catch {
      router.refresh();
    }
    setUiState({ mode: 'list' });
  };

  // -------------------------------------------------------------------------
  // Reorder helpers — swap order values between two adjacent policies
  // -------------------------------------------------------------------------

  const reorder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= policies.length) return;

    const current = policies[index];
    const target = policies[targetIndex];

    if (loadingId) return;
    setLoadingId(current._id);
    setErrorId(null);

    if (!csrfToken) {
      setErrorId({ id: current._id, message: 'Missing CSRF token. Please log in again.' });
      setLoadingId(null);
      return;
    }

    try {
      // Swap order values: PATCH each of the two policies
      const [res1, res2] = await Promise.all([
        fetch(`/api/branches/${branchId}/policies/${current._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ order: target.order }),
        }),
        fetch(`/api/branches/${branchId}/policies/${target._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ order: current.order }),
        }),
      ]);

      if (!res1.ok || !res2.ok) {
        const failedRes = !res1.ok ? res1 : res2;
        const data = await failedRes.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to reorder policies.');
      }

      // Optimistic local update
      setPolicies((prev) => {
        const updated = [...prev];
        updated[index] = { ...current, order: target.order };
        updated[targetIndex] = { ...target, order: current.order };
        return updated.sort((a, b) => a.order - b.order);
      });

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder.';
      setErrorId({ id: current._id, message });
    } finally {
      setLoadingId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  const handleDelete = async (id: string) => {
    if (loadingId) return;
    if (!csrfToken) {
      setErrorId({ id, message: 'Missing CSRF token. Please log in again.' });
      return;
    }

    setLoadingId(id);
    setErrorId(null);
    setConfirmDeleteId(null);

    try {
      const res = await fetch(`/api/branches/${branchId}/policies/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed with status ${res.status}`);
      }

      setPolicies((prev) => prev.filter((p) => p._id !== id));
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete policy.';
      setErrorId({ id, message });
    } finally {
      setLoadingId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Action header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{policies.length}</span>{' '}
          {policies.length === 1 ? 'policy' : 'policies'} configured
        </p>
        {uiState.mode === 'list' && (
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Policy
          </button>
        )}
      </div>

      {/* Create form */}
      {uiState.mode === 'create' && (
        <PolicyForm
          branchId={branchId}
          mode="create"
          onSuccess={refreshPolicies}
          onCancel={() => setUiState({ mode: 'list' })}
        />
      )}

      {/* Empty state */}
      {policies.length === 0 && uiState.mode !== 'create' && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3" aria-hidden="true">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No policies configured yet.</p>
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
          >
            Add First Policy
          </button>
        </div>
      )}

      {/* Policies list */}
      {policies.length > 0 && (
        <div className="space-y-3">
          {policies.map((policy, index) => {
            const isLoading = loadingId === policy._id;
            const rowError = errorId?.id === policy._id ? errorId.message : null;
            const isConfirmingDelete = confirmDeleteId === policy._id;
            const isEditing = uiState.mode === 'edit' && uiState.policy._id === policy._id;

            return (
              <div key={policy._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isEditing ? (
                  <div className="p-5">
                    <PolicyForm
                      branchId={branchId}
                      mode="edit"
                      policyId={policy._id}
                      defaultValues={{ title: policy.title, body: policy.body, order: policy.order }}
                      onSuccess={refreshPolicies}
                      onCancel={() => setUiState({ mode: 'list' })}
                    />
                  </div>
                ) : (
                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Order badge */}
                        <span
                          className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#0B0B3B] text-white text-xs font-bold"
                          aria-label={`Order ${policy.order}`}
                        >
                          {policy.order}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{policy.title}</h3>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Move up */}
                        <button
                          type="button"
                          onClick={() => reorder(index, 'up')}
                          disabled={index === 0 || !!loadingId}
                          aria-label={`Move "${policy.title}" up`}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
                        >
                          {isLoading ? <Spinner /> : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </button>

                        {/* Move down */}
                        <button
                          type="button"
                          onClick={() => reorder(index, 'down')}
                          disabled={index === policies.length - 1 || !!loadingId}
                          aria-label={`Move "${policy.title}" down`}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Edit */}
                        {!isConfirmingDelete && (
                          <button
                            type="button"
                            onClick={() => setUiState({ mode: 'edit', policy })}
                            disabled={!!loadingId}
                            aria-label={`Edit "${policy.title}"`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        )}

                        {/* Delete / Confirm delete */}
                        {!isConfirmingDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(policy._id)}
                            disabled={!!loadingId}
                            aria-label={`Delete "${policy.title}"`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5" role="group" aria-label="Confirm delete">
                            <span className="text-xs text-gray-600">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(policy._id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-800"
                            >
                              {isLoading ? <Spinner /> : 'Yes, delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isLoading}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row error */}
                    {rowError && (
                      <p role="alert" className="mt-2 text-xs text-red-600">{rowError}</p>
                    )}

                    {/* Policy body preview */}
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">{policy.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
