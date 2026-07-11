/**
 * FoodMenuTable — Displays a weekly food menu (breakfast, lunch, dinner × 7 days)
 * for a branch on the Branch Detail Page.
 *
 * Server Component (no 'use client' needed).
 * Requirements: 3.4
 *
 * Desktop (≥640 px): 3-row × 7-col table (Breakfast/Lunch/Dinner × Mon–Sun)
 * Mobile (<640 px): vertical stack of day cards, each listing all three meals
 *
 * Missing cells render "–" (en-dash). Empty state shown when no items provided.
 */

import { buildFoodMenuMap, FoodMenuItem } from '@/lib/utils/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FoodMenuTableProps {
  items: FoodMenuItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** Short day abbreviations shown as column headers */
const DAY_ABBR: Record<(typeof DAYS)[number], string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;

/** Display labels for each meal */
const MEAL_LABELS: Record<(typeof MEALS)[number], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

/** Decorative meal icons for mobile day cards */
const MEAL_ICONS: Record<(typeof MEALS)[number], string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a cell value: comma-joined items string, or the en-dash placeholder */
function formatCell(value: string[] | null | undefined): string {
  if (!value || value.length === 0) return '–';
  return value.join(', ');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FoodMenuTable({ items }: FoodMenuTableProps) {
  // Empty state — no food menu items at all
  if (!items || items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-white/10 bg-white/5"
        role="status"
        aria-label="No food menu available"
      >
        <span className="text-4xl mb-3" aria-hidden="true">
          🍽️
        </span>
        <p className="text-gray-400 text-sm text-center">
          Food menu is not yet available for this branch.
        </p>
      </div>
    );
  }

  const menuMap = buildFoodMenuMap(items);

  return (
    <div>
      {/* ── Desktop table (≥640 px) ─────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
        <table
          className="w-full text-sm"
          aria-label="Weekly food menu"
        >
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {/* Empty top-left cell above meal row headers */}
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-24"
                aria-label="Meal"
              >
                Meal
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {DAY_ABBR[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEALS.map((meal, rowIndex) => {
              const isEvenRow = rowIndex % 2 === 0;
              return (
                <tr
                  key={meal}
                  className={[
                    'border-b border-white/5 last:border-b-0',
                    isEvenRow ? 'bg-transparent' : 'bg-white/[0.02]',
                  ].join(' ')}
                >
                  {/* Row header — meal name */}
                  <th
                    scope="row"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#F5C518] whitespace-nowrap"
                  >
                    {MEAL_LABELS[meal]}
                  </th>

                  {/* One cell per day */}
                  {DAYS.map((day) => {
                    const cellValue = menuMap.get(day)?.get(meal);
                    const displayText = formatCell(cellValue);
                    const isMissing = displayText === '–';

                    return (
                      <td
                        key={day}
                        className="px-3 py-3 text-center align-top"
                        aria-label={`${MEAL_LABELS[meal]} on ${day}: ${isMissing ? 'not available' : displayText}`}
                      >
                        {isMissing ? (
                          <span className="text-gray-600 select-none" aria-hidden="true">
                            –
                          </span>
                        ) : (
                          <span className="text-white/80 text-xs leading-relaxed">
                            {displayText}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile day cards (<640 px) ───────────────────────────────────── */}
      <div className="sm:hidden space-y-3" aria-label="Weekly food menu">
        {DAYS.map((day) => {
          const dayMap = menuMap.get(day);

          return (
            <div
              key={day}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
            >
              {/* Day card header */}
              <div className="px-4 py-2.5 bg-white/[0.04] border-b border-white/10">
                <h3 className="text-sm font-semibold text-[#F5C518]">{day}</h3>
              </div>

              {/* Meals for this day */}
              <ul className="divide-y divide-white/5">
                {MEALS.map((meal) => {
                  const cellValue = dayMap?.get(meal);
                  const displayText = formatCell(cellValue);
                  const isMissing = displayText === '–';

                  return (
                    <li
                      key={meal}
                      className="flex items-start gap-3 px-4 py-2.5"
                      aria-label={`${MEAL_LABELS[meal]}: ${isMissing ? 'not available' : displayText}`}
                    >
                      {/* Meal icon */}
                      <span
                        className="flex-shrink-0 text-base leading-5 mt-0.5"
                        aria-hidden="true"
                        title={MEAL_LABELS[meal]}
                      >
                        {MEAL_ICONS[meal]}
                      </span>

                      <div className="flex flex-col gap-0.5 min-w-0">
                        {/* Meal label */}
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          {MEAL_LABELS[meal]}
                        </span>
                        {/* Food items or dash */}
                        {isMissing ? (
                          <span className="text-gray-600 text-sm" aria-hidden="true">
                            –
                          </span>
                        ) : (
                          <span className="text-white/80 text-sm leading-snug break-words">
                            {displayText}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
