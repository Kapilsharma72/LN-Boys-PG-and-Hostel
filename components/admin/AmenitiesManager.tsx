'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * AmenitiesManager (Client Component)
 *
 * Task 20.4 — List, create, edit, delete amenities for a branch.
 *
 * Requirements: 1.3 (Amenity schema), 1.11 (field-level validation for name and category)
 *
 * Features:
 * - Inline amenity table with edit/delete actions
 * - Add/Edit form with react-hook-form + Zod client-side validation
 * - Field-level errors for name and category (per req 1.11)
 * - All mutations use X-CSRF-Token header
 * - Loading states with spinners; errors preserve field values
 * - Icon field included (required by Amenity schema)
 */

// ---------------------------------------------------------------------------
// Zod schema — mirrors server-side AmenityCreateSchema
// ---------------------------------------------------------------------------

const AmenityFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  icon: z
    .string()
    .min(1, 'Icon is required')
    .max(100, 'Icon must be at most 100 characters'),
  category: z.enum(['basic', 'safety', 'comfort', 'food'] as const, {
    error: 'Category is required',
  }),
});

type AmenityFormValues = z.infer<typeof AmenityFormSchema>;

// ---------------------------------------------------------------------------
// Amenity type (from API / server props)
// ---------------------------------------------------------------------------

export interface AmenityRow {
  _id: string;
  branchId: string;
  name: string;
  icon: string;
  category: 'basic' | 'safety' | 'comfort' | 'food';
}

// ---------------------------------------------------------------------------
// Category display helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<AmenityRow['category'], string> = {
  basic: 'Basic',
  safety: 'Safety',
  comfort: 'Comfort',
  food: 'Food',
};

const CATEGORY_COLORS: Record<AmenityRow['category'], string> = {
  basic: 'bg-blue-100 text-blue-700',
  safety: 'bg-red-100 text-red-700',
  comfort: 'bg-purple-100 text-purple-700',
  food: 'bg-green-100 text-green-700',
};

function CategoryBadge({ category }: { category: AmenityRow['category'] }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helper: shared input class
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean): string {
  return [
    'w-full px-3 py-2 rounded-lg border text-sm text-gray-900',
    'focus:outline-none focus:ring-2 focus:ring-[#0B0B3B] focus:border-transparent',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    hasError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// AmenityForm — create or edit a single amenity
// ---------------------------------------------------------------------------

interface AmenityFormProps {
  branchId: string;
  mode: 'create' | 'edit';
  amenityId?: string;
  defaultValues?: Partial<AmenityFormValues>;
  onSuccess: () => void;
  onCancel: () => void;
}

function AmenityForm({
  branchId,
  mode,
  amenityId,
  defaultValues,
  onSuccess,
  onCancel,
}: AmenityFormProps) {
  const csrfToken = useCsrfToken();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AmenityFormValues>({
    resolver: zodResolver(AmenityFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      icon: defaultValues?.icon ?? '',
      category: defaultValues?.category ?? 'basic',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: AmenityFormValues) => {
    if (!csrfToken) {
      setServerError('Missing CSRF token. Please log in again.');
      return;
    }
    setServerError(null);

    const url =
      mode === 'create'
        ? `/api/branches/${branchId}/amenities`
        : `/api/branches/${branchId}/amenities/${amenityId}`;
    const method = mode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
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
      aria-label={mode === 'create' ? 'Add amenity form' : 'Edit amenity form'}
      className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
    >
      <h3 className="text-sm font-semibold text-gray-700">
        {mode === 'create' ? 'Add New Amenity' : 'Edit Amenity'}
      </h3>

      {/* Server error banner */}
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"
        >
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name — required, field-level validation per req 1.11 */}
        <div>
          <label
            htmlFor={`amenity-name-${mode}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`amenity-name-${mode}`}
            type="text"
            maxLength={100}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `amenity-name-${mode}-error` : undefined}
            disabled={isSubmitting}
            placeholder="e.g. High-Speed Wi-Fi"
            className={inputClass(!!errors.name)}
            {...register('name')}
          />
          {errors.name && (
            <p
              id={`amenity-name-${mode}-error`}
              role="alert"
              className="mt-1 text-xs text-red-600"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Category — required, field-level validation per req 1.11 */}
        <div>
          <label
            htmlFor={`amenity-category-${mode}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id={`amenity-category-${mode}`}
            aria-required="true"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? `amenity-category-${mode}-error` : undefined}
            disabled={isSubmitting}
            className={inputClass(!!errors.category)}
            {...register('category')}
          >
            <option value="basic">Basic</option>
            <option value="safety">Safety</option>
            <option value="comfort">Comfort</option>
            <option value="food">Food</option>
          </select>
          {errors.category && (
            <p
              id={`amenity-category-${mode}-error`}
              role="alert"
              className="mt-1 text-xs text-red-600"
            >
              {errors.category.message}
            </p>
          )}
        </div>
      </div>

      {/* Icon — required (Amenity schema field) */}
      <div>
        <label
          htmlFor={`amenity-icon-${mode}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Icon{' '}
          <span className="text-red-500" aria-hidden="true">*</span>
          <span className="text-xs text-gray-400 font-normal ml-1">(emoji or icon name, max 100 chars)</span>
        </label>
        <input
          id={`amenity-icon-${mode}`}
          type="text"
          maxLength={100}
          aria-required="true"
          aria-invalid={!!errors.icon}
          aria-describedby={errors.icon ? `amenity-icon-${mode}-error` : undefined}
          disabled={isSubmitting}
          placeholder="e.g. 📶 or wifi"
          className={inputClass(!!errors.icon)}
          {...register('icon')}
        />
        {errors.icon && (
          <p
            id={`amenity-icon-${mode}-error`}
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {errors.icon.message}
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
            isSubmitting
              ? 'bg-yellow-300 cursor-not-allowed opacity-70'
              : 'bg-[#F5C518] hover:bg-yellow-400',
          ].join(' ')}
        >
          {isSubmitting ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving…
            </>
          ) : mode === 'create' ? (
            'Add Amenity'
          ) : (
            'Save Changes'
          )}
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
// DeleteAmenityButton — inline confirm/cancel pattern
// ---------------------------------------------------------------------------

interface DeleteAmenityButtonProps {
  branchId: string;
  amenityId: string;
  amenityName: string;
  onDeleted: () => void;
}

function DeleteAmenityButton({
  branchId,
  amenityId,
  amenityName,
  onDeleted,
}: DeleteAmenityButtonProps) {
  const csrfToken = useCsrfToken();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!csrfToken) {
      setError('Missing CSRF token. Please log in again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/branches/${branchId}/amenities/${amenityId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to delete amenity.');
        setLoading(false);
        return;
      }
      onDeleted();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-1">
            Delete &ldquo;{amenityName}&rdquo;?
          </span>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
            aria-label={`Confirm delete ${amenityName}`}
          >
            {loading ? 'Deleting…' : 'Confirm'}
          </button>
          <button
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            aria-label="Cancel delete"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-600 text-right">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setError(null);
        setConfirming(true);
      }}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
      aria-label={`Delete ${amenityName}`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Delete
    </button>
  );
}

// ---------------------------------------------------------------------------
// AmenitiesManager — main exported component
// ---------------------------------------------------------------------------

interface AmenitiesManagerProps {
  branchId: string;
  initialAmenities: AmenityRow[];
}

type UIState =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'edit'; amenity: AmenityRow };

export default function AmenitiesManager({
  branchId,
  initialAmenities,
}: AmenitiesManagerProps) {
  const router = useRouter();
  const [amenities, setAmenities] = useState<AmenityRow[]>(initialAmenities);
  const [uiState, setUiState] = useState<UIState>({ mode: 'list' });

  // Refetch amenities from the server after mutations
  const refreshAmenities = async () => {
    try {
      const res = await fetch(`/api/branches/${branchId}/amenities`);
      const json = await res.json();
      if (res.ok && json.success) {
        setAmenities(json.data as AmenityRow[]);
      }
    } catch {
      // Fallback: use router.refresh() to re-run server component
      router.refresh();
    }
    setUiState({ mode: 'list' });
  };

  const handleFormSuccess = () => {
    refreshAmenities();
  };

  const handleDeleted = () => {
    refreshAmenities();
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Action header                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{amenities.length}</span>{' '}
          {amenities.length === 1 ? 'amenity' : 'amenities'} configured
        </p>
        {uiState.mode === 'list' && (
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Amenity
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Create form                                                       */}
      {/* ---------------------------------------------------------------- */}
      {uiState.mode === 'create' && (
        <AmenityForm
          branchId={branchId}
          mode="create"
          onSuccess={handleFormSuccess}
          onCancel={() => setUiState({ mode: 'list' })}
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Amenities table / empty state                                     */}
      {/* ---------------------------------------------------------------- */}
      {amenities.length === 0 && uiState.mode !== 'create' ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div
            className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"
            aria-hidden="true"
          >
            <svg
              className="w-7 h-7 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No amenities configured yet.</p>
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
          >
            Add First Amenity
          </button>
        </div>
      ) : (
        amenities.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-100"
                aria-label="Amenities list"
              >
                <thead className="bg-gray-50">
                  <tr>
                    {['Icon', 'Name', 'Category', 'Actions'].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {amenities.map((amenity) => (
                    <tr
                      key={amenity._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Edit form rendered inline in the row */}
                      {uiState.mode === 'edit' &&
                      uiState.amenity._id === amenity._id ? (
                        <td colSpan={4} className="px-5 py-4">
                          <AmenityForm
                            branchId={branchId}
                            mode="edit"
                            amenityId={amenity._id}
                            defaultValues={{
                              name: amenity.name,
                              icon: amenity.icon,
                              category: amenity.category,
                            }}
                            onSuccess={handleFormSuccess}
                            onCancel={() => setUiState({ mode: 'list' })}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-lg whitespace-nowrap">
                            {amenity.icon}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {amenity.name}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <CategoryBadge category={amenity.category} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setUiState({ mode: 'edit', amenity })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                                aria-label={`Edit ${amenity.name}`}
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </button>
                              <DeleteAmenityButton
                                branchId={branchId}
                                amenityId={amenity._id}
                                amenityName={amenity.name}
                                onDeleted={handleDeleted}
                              />
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
