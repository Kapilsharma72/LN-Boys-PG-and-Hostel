'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * RoomsManager (Client Component)
 *
 * Task 20.3 — List, create, edit, delete rooms for a branch.
 *
 * Requirements: 1.2 (Room schema), 1.11 (field-level validation for occupancyType and pricePerMonth)
 *
 * Features:
 * - Inline room table with edit/delete actions
 * - Add/Edit form with react-hook-form + Zod client-side validation
 * - Field-level errors for occupancyType and pricePerMonth
 * - All mutations use X-CSRF-Token header
 * - Loading states with spinners; errors preserve field values
 */

// ---------------------------------------------------------------------------
// Zod schema — mirrors server-side validation (RoomCreateSchema)
// ---------------------------------------------------------------------------

const RoomFormSchema = z.object({
  occupancyType: z.enum(['Single', 'Double', 'Triple'] as const, {
    error: 'Occupancy type is required',
  }),
  pricePerMonth: z
    .number({
      error: 'Price must be a number',
    })
    .min(0.01, 'Price must be at least ₹0.01')
    .max(999999.99, 'Price must be at most ₹9,99,999.99'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  available: z.boolean().optional(),
});

type RoomFormValues = z.infer<typeof RoomFormSchema>;

// ---------------------------------------------------------------------------
// Room type (from API / server props)
// ---------------------------------------------------------------------------

export interface RoomRow {
  _id: string;
  branchId: string;
  occupancyType: 'Single' | 'Double' | 'Triple';
  pricePerMonth: number;
  description: string;
  available: boolean;
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
// Availability badge
// ---------------------------------------------------------------------------

function AvailabilityBadge({ available }: { available: boolean }) {
  if (available) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
      Unavailable
    </span>
  );
}

// ---------------------------------------------------------------------------
// RoomForm — create or edit a single room
// ---------------------------------------------------------------------------

interface RoomFormProps {
  branchId: string;
  mode: 'create' | 'edit';
  roomId?: string;
  defaultValues?: Partial<RoomFormValues>;
  onSuccess: () => void;
  onCancel: () => void;
}

function RoomForm({
  branchId,
  mode,
  roomId,
  defaultValues,
  onSuccess,
  onCancel,
}: RoomFormProps) {
  const csrfToken = useCsrfToken();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(RoomFormSchema),
    defaultValues: {
      occupancyType: defaultValues?.occupancyType ?? 'Single',
      pricePerMonth: defaultValues?.pricePerMonth ?? undefined,
      description: defaultValues?.description ?? '',
      available: defaultValues?.available ?? true,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: RoomFormValues) => {
    if (!csrfToken) {
      setServerError('Missing CSRF token. Please log in again.');
      return;
    }
    setServerError(null);

    const url =
      mode === 'create'
        ? `/api/branches/${branchId}/rooms`
        : `/api/branches/${branchId}/rooms/${roomId}`;
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

      setServerError(json.error ?? 'An error occurred. Please try again.');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={mode === 'create' ? 'Add room form' : 'Edit room form'}
      className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
    >
      <h3 className="text-sm font-semibold text-gray-700">
        {mode === 'create' ? 'Add New Room' : 'Edit Room'}
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
        {/* Occupancy Type — required, field-level validation per req 1.11 */}
        <div>
          <label
            htmlFor={`occupancy-type-${mode}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Occupancy Type <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id={`occupancy-type-${mode}`}
            aria-required="true"
            aria-invalid={!!errors.occupancyType}
            aria-describedby={errors.occupancyType ? `occupancy-type-${mode}-error` : undefined}
            disabled={isSubmitting}
            className={inputClass(!!errors.occupancyType)}
            {...register('occupancyType')}
          >
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
          </select>
          {errors.occupancyType && (
            <p
              id={`occupancy-type-${mode}-error`}
              role="alert"
              className="mt-1 text-xs text-red-600"
            >
              {errors.occupancyType.message}
            </p>
          )}
        </div>

        {/* Price Per Month — required, field-level validation per req 1.11 */}
        <div>
          <label
            htmlFor={`price-per-month-${mode}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price/Month (₹) <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id={`price-per-month-${mode}`}
            type="number"
            step="0.01"
            min="0.01"
            max="999999.99"
            aria-required="true"
            aria-invalid={!!errors.pricePerMonth}
            aria-describedby={errors.pricePerMonth ? `price-per-month-${mode}-error` : undefined}
            disabled={isSubmitting}
            placeholder="8000"
            className={inputClass(!!errors.pricePerMonth)}
            {...register('pricePerMonth', { valueAsNumber: true })}
          />
          {errors.pricePerMonth && (
            <p
              id={`price-per-month-${mode}-error`}
              role="alert"
              className="mt-1 text-xs text-red-600"
            >
              {errors.pricePerMonth.message}
            </p>
          )}
        </div>
      </div>

      {/* Description — optional */}
      <div>
        <label
          htmlFor={`description-${mode}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description <span className="text-xs text-gray-400 font-normal">(optional, max 500 chars)</span>
        </label>
        <textarea
          id={`description-${mode}`}
          rows={2}
          maxLength={500}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? `description-${mode}-error` : undefined}
          disabled={isSubmitting}
          placeholder="Spacious room with attached bathroom…"
          className={inputClass(!!errors.description) + ' resize-none'}
          {...register('description')}
        />
        {errors.description && (
          <p
            id={`description-${mode}-error`}
            role="alert"
            className="mt-1 text-xs text-red-600"
          >
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Available toggle */}
      <div className="flex items-center gap-2">
        <input
          id={`available-${mode}`}
          type="checkbox"
          disabled={isSubmitting}
          className="w-4 h-4 rounded border-gray-300 text-[#0B0B3B] focus:ring-[#0B0B3B]"
          {...register('available')}
        />
        <label htmlFor={`available-${mode}`} className="text-sm text-gray-700">
          Mark as available
        </label>
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
            'Add Room'
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
// DeleteRoomButton — inline confirm/cancel pattern
// ---------------------------------------------------------------------------

interface DeleteRoomButtonProps {
  branchId: string;
  roomId: string;
  occupancyType: string;
  onDeleted: () => void;
}

function DeleteRoomButton({
  branchId,
  roomId,
  occupancyType,
  onDeleted,
}: DeleteRoomButtonProps) {
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
      const res = await fetch(`/api/branches/${branchId}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to delete room.');
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
          <span className="text-xs text-gray-600 mr-1">Delete &ldquo;{occupancyType}&rdquo;?</span>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
            aria-label={`Confirm delete ${occupancyType} room`}
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
      aria-label={`Delete ${occupancyType} room`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete
    </button>
  );
}

// ---------------------------------------------------------------------------
// RoomsManager — main exported component
// ---------------------------------------------------------------------------

interface RoomsManagerProps {
  branchId: string;
  initialRooms: RoomRow[];
}

type UIState =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'edit'; room: RoomRow };

export default function RoomsManager({ branchId, initialRooms }: RoomsManagerProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomRow[]>(initialRooms);
  const [uiState, setUiState] = useState<UIState>({ mode: 'list' });

  // Refetch rooms from the server after mutations
  const refreshRooms = async () => {
    try {
      const res = await fetch(`/api/branches/${branchId}/rooms`);
      const json = await res.json();
      if (res.ok && json.success) {
        setRooms(json.data as RoomRow[]);
      }
    } catch {
      // Fallback: use router.refresh() to re-run server component
      router.refresh();
    }
    setUiState({ mode: 'list' });
  };

  const handleFormSuccess = () => {
    refreshRooms();
  };

  const handleDeleted = () => {
    refreshRooms();
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Action header                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{rooms.length}</span>{' '}
          {rooms.length === 1 ? 'room' : 'rooms'} configured
        </p>
        {uiState.mode === 'list' && (
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Room
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Create form                                                       */}
      {/* ---------------------------------------------------------------- */}
      {uiState.mode === 'create' && (
        <RoomForm
          branchId={branchId}
          mode="create"
          onSuccess={handleFormSuccess}
          onCancel={() => setUiState({ mode: 'list' })}
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Rooms table                                                       */}
      {/* ---------------------------------------------------------------- */}
      {rooms.length === 0 && uiState.mode !== 'create' ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div
            className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"
            aria-hidden="true"
          >
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No rooms configured yet.</p>
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
          >
            Add First Room
          </button>
        </div>
      ) : (
        rooms.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-100"
                aria-label="Rooms list"
              >
                <thead className="bg-gray-50">
                  <tr>
                    {['Occupancy Type', 'Price/Month', 'Description', 'Availability', 'Actions'].map(
                      (heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rooms.map((room) => (
                    <tr key={room._id} className="hover:bg-gray-50 transition-colors">
                      {/* Edit form rendered inline in the row */}
                      {uiState.mode === 'edit' && uiState.room._id === room._id ? (
                        <td colSpan={5} className="px-5 py-4">
                          <RoomForm
                            branchId={branchId}
                            mode="edit"
                            roomId={room._id}
                            defaultValues={{
                              occupancyType: room.occupancyType,
                              pricePerMonth: room.pricePerMonth,
                              description: room.description,
                              available: room.available,
                            }}
                            onSuccess={handleFormSuccess}
                            onCancel={() => setUiState({ mode: 'list' })}
                          />
                        </td>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {room.occupancyType}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                            ₹{room.pricePerMonth.toLocaleString('en-IN')}/mo
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {room.description || <span className="text-gray-400 italic">—</span>}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <AvailabilityBadge available={room.available} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setUiState({ mode: 'edit', room })}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                                aria-label={`Edit ${room.occupancyType} room`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <DeleteRoomButton
                                branchId={branchId}
                                roomId={room._id}
                                occupancyType={room.occupancyType}
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
