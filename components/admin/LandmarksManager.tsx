'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * LandmarksManager (Client Component)
 *
 * Task 20.8 — List, create, edit, delete landmarks for a branch.
 *
 * Requirements: 1.7 (Landmark schema)
 *
 * Fields: name (required), category (required enum), distanceMetres (required int ≥ 0),
 *         googleMapsUrl (required valid URL)
 */

// ---------------------------------------------------------------------------
// Zod schema — mirrors server-side LandmarkCreateSchema
// ---------------------------------------------------------------------------

const LandmarkFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(120, 'Name must be at most 120 characters'),
  category: z.enum(['college', 'hospital', 'transport', 'other'] as const, {
    error: 'Category is required',
  }),
  distanceMetres: z
    .number({ error: 'Distance must be a number' })
    .int('Distance must be a whole number')
    .min(0, 'Distance must be 0 or greater'),
  googleMapsUrl: z
    .string()
    .min(1, 'Google Maps URL is required')
    .max(500, 'Google Maps URL must be at most 500 characters')
    .url('Must be a valid URL'),
});

type LandmarkFormValues = z.infer<typeof LandmarkFormSchema>;

// ---------------------------------------------------------------------------
// Landmark type (from API / server props)
// ---------------------------------------------------------------------------

export interface LandmarkRow {
  _id: string;
  branchId: string;
  name: string;
  category: 'college' | 'hospital' | 'transport' | 'other';
  distanceMetres: number;
  googleMapsUrl: string;
}

// ---------------------------------------------------------------------------
// Category display helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<LandmarkRow['category'], string> = {
  college: 'College',
  hospital: 'Hospital',
  transport: 'Transport',
  other: 'Other',
};

const CATEGORY_COLORS: Record<LandmarkRow['category'], string> = {
  college: 'bg-blue-100 text-blue-700',
  hospital: 'bg-red-100 text-red-700',
  transport: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

function CategoryBadge({ category }: { category: LandmarkRow['category'] }) {
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
// LandmarkForm — create or edit a single landmark
// ---------------------------------------------------------------------------

interface LandmarkFormProps {
  branchId: string;
  mode: 'create' | 'edit';
  landmarkId?: string;
  defaultValues?: Partial<Omit<LandmarkFormValues, 'distanceMetres'>> & { distanceMetres?: number };
  onSuccess: () => void;
  onCancel: () => void;
}

function LandmarkForm({
  branchId,
  mode,
  landmarkId,
  defaultValues,
  onSuccess,
  onCancel,
}: LandmarkFormProps) {
  const csrfToken = useCsrfToken();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LandmarkFormValues>({
    resolver: zodResolver(LandmarkFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      category: defaultValues?.category ?? 'college',
      distanceMetres: defaultValues?.distanceMetres ?? 0,
      googleMapsUrl: defaultValues?.googleMapsUrl ?? '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: LandmarkFormValues) => {
    if (!csrfToken) {
      setServerError('Missing CSRF token. Please log in again.');
      return;
    }
    setServerError(null);

    const url =
      mode === 'create'
        ? `/api/branches/${branchId}/landmarks`
        : `/api/branches/${branchId}/landmarks/${landmarkId}`;
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
      aria-label={mode === 'create' ? 'Add landmark form' : 'Edit landmark form'}
      className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
    >
      <h3 className="text-sm font-semibold text-gray-700">
        {mode === 'create' ? 'Add New Landmark' : 'Edit Landmark'}
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
        {/* Name — required */}
        <div>
          <label
            htmlFor={`landmark-name-${mode}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`landmark-name-${mode}`}
            type="text"
            maxLength={120}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `landmark-name-${mode}-error` : undefined}
            disabled={isSubmitting}
            placeholder="e.g. JECRC University"
            className={inputClass(!!errors.name)}
            {...register('name')}
          />
          {errors.name && (
            <p
              id={`landmark-name-${mode}-error`}
              role="alert"
              className="mt-1 text-xs text-red-600"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Category — required */}
        <div>
          <label
            htmlFor={`landmark-category-${mode}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id={`landmark-category-${mode}`}
            aria-required="true"
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? `landmark-category-${mode}-error` : undefined}
            disabled={isSubmitting}
            className={inputClass(!!errors.category)}
            {...register('category')}
          >
            <option value="college">College</option>
            <option value="hospital">Hospital</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>
          {errors.category && (
            <p
              id={`landmark-category-${mode}-error`}
              role="alert"
              className="mt-1 text-xs text-red-600"
            >
              {errors.category.message}
            </p>
          )}
        </div>
      </div>

      {/* Distance (metres) — required */}
      <div>
        <label
          htmlFor={`landmark-distance-${mode}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Distance (metres){' '}
          <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id={`landmark-distance-${mode}`}
          type="number"
          min={0}
          step={1}
          aria-required="true"
          aria-invalid={!!errors.distanceMetres}
          aria-describedby={errors.distanceMetres ? `landmark-distance-${mode}-error` : undefined}
          disabled={isSubmitting}
          placeholder="e.g. 500"
          className={inputClass(!!errors.distanceMetres)}
          {...register('distanceMetres', { valueAsNumber: true })}
        />
        {errors.distanceMetres && (
          <p
            id={`landmark-distance-${mode}-error`}
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {errors.distanceMetres.message}
          </p>
        )}
      </div>

      {/* Google Maps URL — required */}
      <div>
        <label
          htmlFor={`landmark-mapsurl-${mode}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Google Maps URL{' '}
          <span className="text-red-500" aria-hidden="true">*</span>
          <span className="text-xs text-gray-400 font-normal ml-1">(max 500 chars)</span>
        </label>
        <input
          id={`landmark-mapsurl-${mode}`}
          type="url"
          maxLength={500}
          aria-required="true"
          aria-invalid={!!errors.googleMapsUrl}
          aria-describedby={errors.googleMapsUrl ? `landmark-mapsurl-${mode}-error` : undefined}
          disabled={isSubmitting}
          placeholder="https://maps.google.com/..."
          className={inputClass(!!errors.googleMapsUrl)}
          {...register('googleMapsUrl')}
        />
        {errors.googleMapsUrl && (
          <p
            id={`landmark-mapsurl-${mode}-error`}
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {errors.googleMapsUrl.message}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving…
            </>
          ) : mode === 'create' ? (
            'Add Landmark'
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
// DeleteLandmarkButton — inline confirm/cancel pattern
// ---------------------------------------------------------------------------

interface DeleteLandmarkButtonProps {
  branchId: string;
  landmarkId: string;
  landmarkName: string;
  onDeleted: () => void;
}

function DeleteLandmarkButton({
  branchId,
  landmarkId,
  landmarkName,
  onDeleted,
}: DeleteLandmarkButtonProps) {
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
      const res = await fetch(`/api/branches/${branchId}/landmarks/${landmarkId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to delete landmark.');
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
            Delete &ldquo;{landmarkName}&rdquo;?
          </span>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
            aria-label={`Confirm delete ${landmarkName}`}
          >
            {loading ? 'Deleting…' : 'Confirm'}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null); }}
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
      onClick={() => { setError(null); setConfirming(true); }}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
      aria-label={`Delete ${landmarkName}`}
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
// LandmarksManager — main exported component
// ---------------------------------------------------------------------------

interface LandmarksManagerProps {
  branchId: string;
  initialLandmarks: LandmarkRow[];
}

type UIState =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'edit'; landmark: LandmarkRow };

export default function LandmarksManager({
  branchId,
  initialLandmarks,
}: LandmarksManagerProps) {
  const router = useRouter();
  const [landmarks, setLandmarks] = useState<LandmarkRow[]>(initialLandmarks);
  const [uiState, setUiState] = useState<UIState>({ mode: 'list' });

  // Refetch landmarks from the server after mutations
  const refreshLandmarks = async () => {
    try {
      const res = await fetch(`/api/branches/${branchId}/landmarks`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLandmarks(json.data as LandmarkRow[]);
      }
    } catch {
      // Fallback: use router.refresh() to re-run server component
      router.refresh();
    }
    setUiState({ mode: 'list' });
  };

  const handleFormSuccess = () => {
    refreshLandmarks();
  };

  const handleDeleted = () => {
    refreshLandmarks();
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Action header                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{landmarks.length}</span>{' '}
          {landmarks.length === 1 ? 'landmark' : 'landmarks'} configured
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Landmark
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Create form                                                       */}
      {/* ---------------------------------------------------------------- */}
      {uiState.mode === 'create' && (
        <LandmarkForm
          branchId={branchId}
          mode="create"
          onSuccess={handleFormSuccess}
          onCancel={() => setUiState({ mode: 'list' })}
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Landmarks table / empty state                                     */}
      {/* ---------------------------------------------------------------- */}
      {landmarks.length === 0 && uiState.mode !== 'create' ? (
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No landmarks configured yet.</p>
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
          >
            Add First Landmark
          </button>
        </div>
      ) : (
        landmarks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-100"
                aria-label="Landmarks list"
              >
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Category', 'Distance', 'Maps Link', 'Actions'].map((heading) => (
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
                  {landmarks.map((landmark) => (
                    <tr
                      key={landmark._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Edit form rendered inline in the row */}
                      {uiState.mode === 'edit' && uiState.landmark._id === landmark._id ? (
                        <td colSpan={5} className="px-5 py-4">
                          <LandmarkForm
                            branchId={branchId}
                            mode="edit"
                            landmarkId={landmark._id}
                            defaultValues={{
                              name: landmark.name,
                              category: landmark.category,
                              distanceMetres: landmark.distanceMetres,
                              googleMapsUrl: landmark.googleMapsUrl,
                            }}
                            onSuccess={handleFormSuccess}
                            onCancel={() => setUiState({ mode: 'list' })}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {landmark.name}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <CategoryBadge category={landmark.category} />
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {landmark.distanceMetres.toLocaleString()} m
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <a
                              href={landmark.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
                              aria-label={`Open Google Maps for ${landmark.name}`}
                            >
                              View Map
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setUiState({ mode: 'edit', landmark })}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                                aria-label={`Edit ${landmark.name}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <DeleteLandmarkButton
                                branchId={branchId}
                                landmarkId={landmark._id}
                                landmarkName={landmark.name}
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
