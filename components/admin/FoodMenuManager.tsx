'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCsrfToken } from './AdminLayoutClient';

/**
 * FoodMenuManager (Client Component)
 *
 * Task 20.5 — CRUD food menu items for a branch.
 *
 * Requirements: 1.4 (FoodMenu schema), 1.11 (field-level validation for day, meal, items)
 *
 * Features:
 * - 7-day × 3-meal grid view of existing menu entries
 * - Add / edit form with react-hook-form + Zod client-side validation
 * - Field-level errors for day, meal, and items (per req 1.11)
 * - Uses upsert POST endpoint (branchId+day+meal compound unique)
 * - All mutations use X-CSRF-Token header
 * - Loading states with spinners; errors preserve field values
 * - Delete with inline confirm/cancel pattern
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;
type Day = typeof DAYS[number];

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
type Meal = typeof MEALS[number];

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

// ---------------------------------------------------------------------------
// Zod schema — mirrors server-side FoodMenuCreateSchema
// ---------------------------------------------------------------------------

const FoodMenuFormSchema = z.object({
  day: z.enum(DAYS, {
    error: 'Day is required',
  }),
  meal: z.enum(MEALS, {
    error: 'Meal is required',
  }),
  items: z
    .array(
      z.object({
        value: z
          .string()
          .min(1, 'Item cannot be empty')
          .max(100, 'Item must be at most 100 characters'),
      })
    )
    .min(1, 'At least one item is required')
    .max(20, 'At most 20 items are allowed'),
});

type FoodMenuFormValues = z.infer<typeof FoodMenuFormSchema>;

// ---------------------------------------------------------------------------
// FoodMenu row type (from API / server props)
// ---------------------------------------------------------------------------

export interface FoodMenuRow {
  _id: string;
  branchId: string;
  day: Day;
  meal: Meal;
  items: string[];
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
// FoodMenuForm — add or edit a single menu entry (upserts via POST)
// ---------------------------------------------------------------------------

interface FoodMenuFormProps {
  branchId: string;
  defaultValues?: {
    day: Day;
    meal: Meal;
    items: string[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function FoodMenuForm({
  branchId,
  defaultValues,
  onSuccess,
  onCancel,
}: FoodMenuFormProps) {
  const csrfToken = useCsrfToken();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FoodMenuFormValues>({
    resolver: zodResolver(FoodMenuFormSchema),
    defaultValues: {
      day: defaultValues?.day ?? 'Monday',
      meal: defaultValues?.meal ?? 'breakfast',
      items: defaultValues?.items?.map((v) => ({ value: v })) ?? [{ value: '' }],
    },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data: FoodMenuFormValues) => {
    if (!csrfToken) {
      setServerError('Missing CSRF token. Please log in again.');
      return;
    }
    setServerError(null);

    try {
      const res = await fetch(`/api/branches/${branchId}/food-menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          day: data.day,
          meal: data.meal,
          items: data.items.map((i) => i.value),
        }),
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
      aria-label="Food menu entry form"
      className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
    >
      <h3 className="text-sm font-semibold text-gray-700">
        {defaultValues ? 'Edit Menu Entry' : 'Add Menu Entry'}
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
        {/* Day — required, field-level validation per req 1.11 */}
        <div>
          <label
            htmlFor="food-menu-day"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Day <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="food-menu-day"
            aria-required="true"
            aria-invalid={!!errors.day}
            aria-describedby={errors.day ? 'food-menu-day-error' : undefined}
            disabled={isSubmitting || !!defaultValues}
            className={inputClass(!!errors.day)}
            {...register('day')}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.day && (
            <p id="food-menu-day-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.day.message}
            </p>
          )}
          {defaultValues && (
            <p className="mt-1 text-xs text-gray-400">Day cannot be changed (upsert key)</p>
          )}
        </div>

        {/* Meal — required, field-level validation per req 1.11 */}
        <div>
          <label
            htmlFor="food-menu-meal"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Meal <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="food-menu-meal"
            aria-required="true"
            aria-invalid={!!errors.meal}
            aria-describedby={errors.meal ? 'food-menu-meal-error' : undefined}
            disabled={isSubmitting || !!defaultValues}
            className={inputClass(!!errors.meal)}
            {...register('meal')}
          >
            {MEALS.map((m) => (
              <option key={m} value={m}>{MEAL_LABELS[m]}</option>
            ))}
          </select>
          {errors.meal && (
            <p id="food-menu-meal-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.meal.message}
            </p>
          )}
          {defaultValues && (
            <p className="mt-1 text-xs text-gray-400">Meal cannot be changed (upsert key)</p>
          )}
        </div>
      </div>

      {/* Items — dynamic list, field-level validation per req 1.11 */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Items <span className="text-red-500" aria-hidden="true">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">(1–20 items, each 1–100 chars)</span>
          </legend>

          {/* List-level error (e.g. min 1 item) */}
          {errors.items && !Array.isArray(errors.items) && (
            <p role="alert" className="mb-2 text-xs text-red-600">
              {errors.items.message}
            </p>
          )}

          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    id={`food-menu-item-${index}`}
                    type="text"
                    maxLength={100}
                    aria-label={`Item ${index + 1}`}
                    aria-required={index === 0}
                    aria-invalid={!!errors.items?.[index]?.value}
                    aria-describedby={
                      errors.items?.[index]?.value
                        ? `food-menu-item-${index}-error`
                        : undefined
                    }
                    disabled={isSubmitting}
                    placeholder={`e.g. ${index === 0 ? 'Poha' : index === 1 ? 'Upma' : 'Tea'}`}
                    className={inputClass(!!(errors.items as { [k: number]: { value?: { message?: string } } } | undefined)?.[index]?.value)}
                    {...register(`items.${index}.value`)}
                  />
                  {(errors.items as { [k: number]: { value?: { message?: string } } } | undefined)?.[index]?.value && (
                    <p
                      id={`food-menu-item-${index}-error`}
                      role="alert"
                      className="mt-0.5 text-xs text-red-600"
                    >
                      {(errors.items as { [k: number]: { value?: { message?: string } } })[index]?.value?.message}
                    </p>
                  )}
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={isSubmitting}
                    aria-label={`Remove item ${index + 1}`}
                    className="mt-1 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {fields.length < 20 && (
            <button
              type="button"
              onClick={() => append({ value: '' })}
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#0B0B3B] font-medium hover:underline disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] rounded"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          )}
        </fieldset>
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
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving…
            </>
          ) : defaultValues ? (
            'Save Changes'
          ) : (
            'Add Entry'
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
// DeleteMenuItemButton — inline confirm/cancel pattern
// ---------------------------------------------------------------------------

interface DeleteMenuItemButtonProps {
  branchId: string;
  itemId: string;
  label: string;
  onDeleted: () => void;
}

function DeleteMenuItemButton({
  branchId,
  itemId,
  label,
  onDeleted,
}: DeleteMenuItemButtonProps) {
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
      const res = await fetch(`/api/branches/${branchId}/food-menu/${itemId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to delete menu entry.');
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
          <span className="text-xs text-gray-600 mr-1">Delete &ldquo;{label}&rdquo;?</span>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
            aria-label={`Confirm delete ${label}`}
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
          <p role="alert" className="text-xs text-red-600 text-right">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setError(null); setConfirming(true); }}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
      aria-label={`Delete ${label}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete
    </button>
  );
}

// ---------------------------------------------------------------------------
// FoodMenuGrid — display food menu in a 7-day × 3-meal grid
// ---------------------------------------------------------------------------

interface FoodMenuGridProps {
  branchId: string;
  entries: FoodMenuRow[];
  onEdit: (entry: FoodMenuRow) => void;
  onDeleted: () => void;
}

function FoodMenuGrid({ branchId, entries, onEdit, onDeleted }: FoodMenuGridProps) {
  // Build lookup map: day -> meal -> entry
  const menuMap = new Map<string, FoodMenuRow>();
  for (const entry of entries) {
    menuMap.set(`${entry.day}-${entry.meal}`, entry);
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="min-w-full border border-gray-200 rounded-xl overflow-hidden"
        aria-label="Food menu grid"
      >
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-28"
            >
              Day
            </th>
            {MEALS.map((meal) => (
              <th
                key={meal}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-l border-gray-200"
              >
                {MEAL_LABELS[meal]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {DAYS.map((day) => (
            <tr key={day} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                {day}
              </td>
              {MEALS.map((meal) => {
                const entry = menuMap.get(`${day}-${meal}`);
                return (
                  <td
                    key={meal}
                    className="px-4 py-3 text-sm text-gray-700 border-l border-gray-200 align-top min-w-[160px]"
                  >
                    {entry ? (
                      <div className="space-y-2">
                        <ul className="list-disc list-inside space-y-0.5">
                          {entry.items.map((item, i) => (
                            <li key={i} className="text-xs text-gray-700 leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => onEdit(entry)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                            aria-label={`Edit ${day} ${MEAL_LABELS[meal]}`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <DeleteMenuItemButton
                            branchId={branchId}
                            itemId={entry._id}
                            label={`${day} ${MEAL_LABELS[meal]}`}
                            onDeleted={onDeleted}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">–</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FoodMenuManager — main exported component
// ---------------------------------------------------------------------------

interface FoodMenuManagerProps {
  branchId: string;
  initialEntries: FoodMenuRow[];
}

type UIState =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'edit'; entry: FoodMenuRow };

export default function FoodMenuManager({
  branchId,
  initialEntries,
}: FoodMenuManagerProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<FoodMenuRow[]>(initialEntries);
  const [uiState, setUiState] = useState<UIState>({ mode: 'list' });

  // Refetch entries from the server after mutations
  const refreshEntries = async () => {
    try {
      const res = await fetch(`/api/branches/${branchId}/food-menu`);
      const json = await res.json();
      if (res.ok && json.success) {
        setEntries(json.data as FoodMenuRow[]);
      }
    } catch {
      router.refresh();
    }
    setUiState({ mode: 'list' });
  };

  const totalSlots = DAYS.length * MEALS.length; // 21
  const filledSlots = entries.length;
  const emptySlots = totalSlots - filledSlots;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Action header                                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{filledSlots}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalSlots}</span> meal slots configured
          {emptySlots > 0 && (
            <span className="ml-1 text-amber-600">({emptySlots} missing)</span>
          )}
        </p>
        {uiState.mode === 'list' && (
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </button>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Create / Edit form                                                */}
      {/* ---------------------------------------------------------------- */}
      {uiState.mode === 'create' && (
        <FoodMenuForm
          branchId={branchId}
          onSuccess={refreshEntries}
          onCancel={() => setUiState({ mode: 'list' })}
        />
      )}

      {uiState.mode === 'edit' && (
        <FoodMenuForm
          branchId={branchId}
          defaultValues={{
            day: uiState.entry.day,
            meal: uiState.entry.meal,
            items: uiState.entry.items,
          }}
          onSuccess={refreshEntries}
          onCancel={() => setUiState({ mode: 'list' })}
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Grid view / empty state                                           */}
      {/* ---------------------------------------------------------------- */}
      {entries.length === 0 && uiState.mode === 'list' ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div
            className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3"
            aria-hidden="true"
          >
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No food menu entries yet.</p>
          <button
            onClick={() => setUiState({ mode: 'create' })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
          >
            Add First Entry
          </button>
        </div>
      ) : (
        uiState.mode !== 'create' && uiState.mode !== 'edit' && (
          <FoodMenuGrid
            branchId={branchId}
            entries={entries}
            onEdit={(entry) => setUiState({ mode: 'edit', entry })}
            onDeleted={refreshEntries}
          />
        )
      )}

      {/* Show the grid below the form as reference when editing */}
      {(uiState.mode === 'create' || uiState.mode === 'edit') && entries.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Current menu (for reference)
          </p>
          <FoodMenuGrid
            branchId={branchId}
            entries={entries}
            onEdit={(entry) => setUiState({ mode: 'edit', entry })}
            onDeleted={refreshEntries}
          />
        </div>
      )}
    </div>
  );
}
