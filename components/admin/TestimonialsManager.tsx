'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * TestimonialsManager (Client Component)
 *
 * Task 20.6 — List testimonials with approve/reject toggle and delete.
 *
 * Requirements: 12.7
 *
 * Features:
 * - Table listing all testimonials (pending and approved)
 * - Approve/reject toggle per row (PATCH with { approved: bool })
 * - Delete with inline confirm/cancel pattern
 * - All mutations use X-CSRF-Token header
 * - Loading states with spinners; errors displayed inline
 * - Status badge (Approved / Pending)
 * - Star rating display
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestimonialRow {
  _id: string;
  branchId: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
  approved: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function ApprovedBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Approved
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      Pending
    </span>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-current"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TestimonialsManager — main component
// ---------------------------------------------------------------------------

interface TestimonialsManagerProps {
  branchId: string;
  initialTestimonials: TestimonialRow[];
}

export default function TestimonialsManager({
  branchId,
  initialTestimonials,
}: TestimonialsManagerProps) {
  const router = useRouter();
  const csrfToken = useCsrfToken();

  // Local copy of testimonials (optimistic updates)
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>(initialTestimonials);

  // Per-row loading / error state
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; message: string } | null>(null);

  // Inline confirm-delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Approve / Reject toggle
  // ---------------------------------------------------------------------------

  async function handleToggleApprove(testimonial: TestimonialRow) {
    if (loadingId) return; // prevent concurrent mutations

    const newApproved = !testimonial.approved;
    setLoadingId(testimonial._id);
    setErrorId(null);

    try {
      const res = await fetch(
        `/api/branches/${branchId}/testimonials/${testimonial._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          },
          body: JSON.stringify({ approved: newApproved }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed with status ${res.status}`);
      }

      // Optimistic update
      setTestimonials((prev) =>
        prev.map((t) =>
          t._id === testimonial._id ? { ...t, approved: newApproved } : t
        )
      );

      // Refresh server data in background so Next.js cache is invalidated
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status.';
      setErrorId({ id: testimonial._id, message });
    } finally {
      setLoadingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete(id: string) {
    if (loadingId) return;

    setLoadingId(id);
    setErrorId(null);
    setConfirmDeleteId(null);

    try {
      const res = await fetch(`/api/branches/${branchId}/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed with status ${res.status}`);
      }

      // Remove from local list
      setTestimonials((prev) => prev.filter((t) => t._id !== id));

      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete testimonial.';
      setErrorId({ id, message });
    } finally {
      setLoadingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render — empty state
  // ---------------------------------------------------------------------------

  if (testimonials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
        <svg
          className="w-12 h-12 mb-3 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500">No testimonials yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Testimonials submitted through the public form will appear here.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — table
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Summary counts */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          <span className="font-semibold text-gray-800">
            {testimonials.filter((t) => t.approved).length}
          </span>{' '}
          approved
        </span>
        <span>
          <span className="font-semibold text-gray-800">
            {testimonials.filter((t) => !t.approved).length}
          </span>{' '}
          pending
        </span>
        <span>
          <span className="font-semibold text-gray-800">{testimonials.length}</span> total
        </span>
      </div>

      {/* Table — responsive wrapper */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Author
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Rating
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Review
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {testimonials.map((t) => {
              const isLoading = loadingId === t._id;
              const rowError = errorId?.id === t._id ? errorId.message : null;
              const isConfirmingDelete = confirmDeleteId === t._id;

              return (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                  {/* Author */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-800">{t.authorName}</span>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StarRating rating={t.rating} />
                  </td>

                  {/* Review text — truncate to keep table tidy */}
                  <td className="px-4 py-3 max-w-xs">
                    <p
                      className="text-gray-600 truncate"
                      title={t.text}
                    >
                      {t.text}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {new Date(t.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ApprovedBadge approved={t.approved} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Inline error for this row */}
                      {rowError && (
                        <span
                          role="alert"
                          className="text-xs text-red-600 mr-1 max-w-[180px] truncate"
                          title={rowError}
                        >
                          {rowError}
                        </span>
                      )}

                      {/* Approve / Reject toggle */}
                      {!isConfirmingDelete && (
                        <button
                          type="button"
                          onClick={() => handleToggleApprove(t)}
                          disabled={isLoading}
                          aria-label={
                            t.approved
                              ? `Reject testimonial by ${t.authorName}`
                              : `Approve testimonial by ${t.authorName}`
                          }
                          className={`
                            inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
                            transition-colors focus-visible:outline focus-visible:outline-2
                            focus-visible:outline-[#0B0B3B] disabled:opacity-50 disabled:cursor-not-allowed
                            ${
                              t.approved
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }
                          `}
                        >
                          {isLoading ? (
                            <Spinner />
                          ) : t.approved ? (
                            <>
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Reject
                            </>
                          ) : (
                            <>
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Approve
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete — inline confirm pattern */}
                      {!isConfirmingDelete ? (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(t._id)}
                          disabled={isLoading}
                          aria-label={`Delete testimonial by ${t.authorName}`}
                          className="
                            inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg
                            bg-red-100 text-red-700 hover:bg-red-200
                            transition-colors focus-visible:outline focus-visible:outline-2
                            focus-visible:outline-[#0B0B3B] disabled:opacity-50 disabled:cursor-not-allowed
                          "
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
                      ) : (
                        /* Confirm / Cancel */
                        <div className="flex items-center gap-1.5" role="group" aria-label="Confirm delete">
                          <span className="text-xs text-gray-600 mr-1">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(t._id)}
                            disabled={isLoading}
                            className="
                              inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg
                              bg-red-600 text-white hover:bg-red-700
                              transition-colors focus-visible:outline focus-visible:outline-2
                              focus-visible:outline-red-800 disabled:opacity-50
                            "
                          >
                            {isLoading ? <Spinner /> : 'Yes, delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isLoading}
                            className="
                              inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg
                              bg-gray-100 text-gray-700 hover:bg-gray-200
                              transition-colors focus-visible:outline focus-visible:outline-2
                              focus-visible:outline-[#0B0B3B] disabled:opacity-50
                            "
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
