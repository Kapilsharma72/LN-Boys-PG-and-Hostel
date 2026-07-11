// @vitest-environment node
/**
 * Property-based tests for FoodMenuTable cell rendering logic.
 *
 * **Validates: Requirements 3.4**
 *
 * Property 3: FoodMenuTable renders all day/meal combinations with "–" for missing entries.
 *
 * Sub-properties tested:
 *   3a — buildFoodMenuMap always returns exactly 7 day keys
 *   3b — Each day's inner Map always has exactly 3 meal keys (breakfast, lunch, dinner)
 *   3c — Total cells (days × meals) is always 7 × 3 = 21
 *   3d — Any day/meal combination present in the input is NOT null in the output
 *   3e — Any day/meal combination absent from the input IS null in the output
 *   3f — formatCell: non-empty array → comma-joined string; null/empty → "–"
 *   3g — For any arbitrary subset of FoodMenuItem inputs, all 21 cells are either
 *         populated (non-empty string) or render as "–"
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildFoodMenuMap, FoodMenuItem } from '@/lib/utils/formatters';

// ─── Constants (mirrored from formatters.ts) ─────────────────────────────────

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

type Day = (typeof DAYS_OF_WEEK)[number];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
type Meal = (typeof MEAL_TYPES)[number];

// ─── formatCell — extracted pure function (mirrors FoodMenuTable.tsx) ─────────

/**
 * Mirrors the formatCell helper in FoodMenuTable.tsx:
 *   null or empty array → "–" (en-dash)
 *   non-empty string array → comma-joined string
 */
function formatCell(value: string[] | null | undefined): string {
  if (!value || value.length === 0) return '–';
  return value.join(', ');
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for a valid day of the week */
const dayArb: fc.Arbitrary<Day> = fc.constantFrom(...DAYS_OF_WEEK);

/** Arbitrary for a valid meal type */
const mealArb: fc.Arbitrary<Meal> = fc.constantFrom(...MEAL_TYPES);

/** Arbitrary for a single food item string (1–100 chars) */
const foodItemArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 100 });

/** Arbitrary for an array of food item strings (1–20 entries per schema) */
const foodItemsArb: fc.Arbitrary<string[]> = fc.array(foodItemArb, {
  minLength: 1,
  maxLength: 20,
});

/** Arbitrary for a single FoodMenuItem */
const foodMenuItemArb: fc.Arbitrary<FoodMenuItem> = fc.record({
  branchId: fc.string({ minLength: 1, maxLength: 40 }),
  day: dayArb,
  meal: mealArb,
  items: foodItemsArb,
});

/**
 * Arbitrary for a deduplicated array of FoodMenuItems.
 * Each (day, meal) pair appears at most once, matching real DB behaviour.
 * We generate up to 21 items and deduplicate by (day, meal) key.
 */
const foodMenuItemsArb: fc.Arbitrary<FoodMenuItem[]> = fc
  .array(foodMenuItemArb, { minLength: 0, maxLength: 50 })
  .map((items) => {
    const seen = new Set<string>();
    const deduped: FoodMenuItem[] = [];
    for (const item of items) {
      const key = `${item.day}|${item.meal}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    return deduped;
  });

// ─── Property 3a — always 7 day keys ─────────────────────────────────────────

describe('Property 3a — buildFoodMenuMap always returns exactly 7 day keys', () => {
  it('result Map has exactly 7 entries for any input', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        expect(menuMap.size).toBe(7);
      }),
      { numRuns: 200 },
    );
  });

  it('the 7 keys are exactly the days of the week in order', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        const keys = Array.from(menuMap.keys());
        expect(keys).toEqual([...DAYS_OF_WEEK]);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 3b — each day map has exactly 3 meal keys ──────────────────────

describe('Property 3b — each day\'s inner Map always has exactly 3 meal keys', () => {
  it('every day in the result has exactly 3 entries (breakfast, lunch, dinner)', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        for (const day of DAYS_OF_WEEK) {
          const dayMap = menuMap.get(day);
          expect(dayMap).toBeDefined();
          expect(dayMap!.size).toBe(3);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('the 3 meal keys for every day are exactly breakfast, lunch, dinner', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        for (const day of DAYS_OF_WEEK) {
          const dayMap = menuMap.get(day)!;
          const mealKeys = Array.from(dayMap.keys());
          expect(mealKeys).toEqual([...MEAL_TYPES]);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 3c — total cells always 21 ─────────────────────────────────────

describe('Property 3c — total cells is always 7 × 3 = 21', () => {
  it('sum of all inner Map sizes equals 21 for any input', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        let totalCells = 0;
        for (const dayMap of menuMap.values()) {
          totalCells += dayMap.size;
        }
        expect(totalCells).toBe(21);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 3d — present input entries → NOT null in output ────────────────

describe('Property 3d — any day/meal in the input is NOT null in the output Map', () => {
  it('every input (day, meal) pair maps to a non-null value', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        for (const item of items) {
          const cellValue = menuMap.get(item.day)?.get(item.meal);
          expect(cellValue).not.toBeNull();
          expect(cellValue).not.toBeUndefined();
        }
      }),
      { numRuns: 200 },
    );
  });

  it('the value for each present input entry equals item.items array', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        for (const item of items) {
          const cellValue = menuMap.get(item.day)?.get(item.meal);
          expect(cellValue).toEqual(item.items);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 3e — absent entries → null in output (renders "–") ─────────────

describe('Property 3e — any day/meal absent from input IS null in the output Map', () => {
  it('cells with no corresponding input item are null', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);

        // Build a set of (day, meal) keys that ARE in the input
        const presentKeys = new Set(items.map((i) => `${i.day}|${i.meal}`));

        for (const day of DAYS_OF_WEEK) {
          for (const meal of MEAL_TYPES) {
            const key = `${day}|${meal}`;
            const cellValue = menuMap.get(day)!.get(meal);
            if (!presentKeys.has(key)) {
              expect(cellValue).toBeNull();
            }
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('null cells format to "–" via formatCell', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        const presentKeys = new Set(items.map((i) => `${i.day}|${i.meal}`));

        for (const day of DAYS_OF_WEEK) {
          for (const meal of MEAL_TYPES) {
            const key = `${day}|${meal}`;
            if (!presentKeys.has(key)) {
              const cellValue = menuMap.get(day)!.get(meal);
              expect(formatCell(cellValue)).toBe('–');
            }
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 3f — formatCell behaviour ──────────────────────────────────────

describe('Property 3f — formatCell: non-empty array → comma-joined; null/empty → "–"', () => {
  it('null input always returns "–"', () => {
    expect(formatCell(null)).toBe('–');
  });

  it('undefined input always returns "–"', () => {
    expect(formatCell(undefined)).toBe('–');
  });

  it('empty array always returns "–"', () => {
    expect(formatCell([])).toBe('–');
  });

  it('non-empty array returns comma-joined string for any string array', () => {
    fc.assert(
      fc.property(foodItemsArb, (items) => {
        const result = formatCell(items);
        expect(result).toBe(items.join(', '));
        expect(result).not.toBe('–');
      }),
      { numRuns: 300 },
    );
  });

  it('result is never "–" for any non-empty string array', () => {
    fc.assert(
      fc.property(foodItemsArb, (items) => {
        // foodItemsArb has minLength: 1, so items is always non-empty
        const result = formatCell(items);
        expect(result).not.toBe('–');
      }),
      { numRuns: 300 },
    );
  });

  it('single-element array returns the element itself (no comma)', () => {
    fc.assert(
      fc.property(foodItemArb, (item) => {
        const result = formatCell([item]);
        expect(result).toBe(item);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 3g — all 21 cells render as populated or "–" ───────────────────

describe('Property 3g — all 21 cells render as populated or "–" for any input subset', () => {
  it('every cell in the 7×3 grid is either a non-empty string or "–"', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);

        for (const day of DAYS_OF_WEEK) {
          for (const meal of MEAL_TYPES) {
            const cellValue = menuMap.get(day)!.get(meal);
            const rendered = formatCell(cellValue);

            // Must be either "–" or a non-empty string
            const isEndash = rendered === '–';
            const isNonEmpty = typeof rendered === 'string' && rendered.length > 0;
            expect(isEndash || isNonEmpty).toBe(true);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('populated cells always render as a non-empty non-dash string', () => {
    fc.assert(
      fc.property(foodMenuItemsArb, (items) => {
        const menuMap = buildFoodMenuMap(items);
        const presentKeys = new Set(items.map((i) => `${i.day}|${i.meal}`));

        for (const day of DAYS_OF_WEEK) {
          for (const meal of MEAL_TYPES) {
            const key = `${day}|${meal}`;
            if (presentKeys.has(key)) {
              const cellValue = menuMap.get(day)!.get(meal);
              const rendered = formatCell(cellValue);
              expect(rendered).not.toBe('–');
              expect(rendered.length).toBeGreaterThan(0);
            }
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Deterministic edge cases ─────────────────────────────────────────────────

describe('Deterministic edge cases for buildFoodMenuMap', () => {
  it('empty input → all 21 cells are null, all render as "–"', () => {
    const menuMap = buildFoodMenuMap([]);
    expect(menuMap.size).toBe(7);
    let nullCount = 0;
    for (const day of DAYS_OF_WEEK) {
      const dayMap = menuMap.get(day)!;
      expect(dayMap.size).toBe(3);
      for (const meal of MEAL_TYPES) {
        expect(dayMap.get(meal)).toBeNull();
        expect(formatCell(dayMap.get(meal))).toBe('–');
        nullCount++;
      }
    }
    expect(nullCount).toBe(21);
  });

  it('full grid (21 items, all days × all meals) → zero null cells', () => {
    const fullGrid: FoodMenuItem[] = [];
    for (const day of DAYS_OF_WEEK) {
      for (const meal of MEAL_TYPES) {
        fullGrid.push({ branchId: 'test', day, meal, items: ['Item A', 'Item B'] });
      }
    }
    const menuMap = buildFoodMenuMap(fullGrid);
    for (const day of DAYS_OF_WEEK) {
      for (const meal of MEAL_TYPES) {
        const val = menuMap.get(day)!.get(meal);
        expect(val).not.toBeNull();
        expect(formatCell(val)).toBe('Item A, Item B');
      }
    }
  });

  it('Monday breakfast only → that cell populated, remaining 20 are null / "–"', () => {
    const items: FoodMenuItem[] = [
      { branchId: 'test', day: 'Monday', meal: 'breakfast', items: ['Poha', 'Tea'] },
    ];
    const menuMap = buildFoodMenuMap(items);

    expect(menuMap.get('Monday')!.get('breakfast')).toEqual(['Poha', 'Tea']);
    expect(formatCell(menuMap.get('Monday')!.get('breakfast'))).toBe('Poha, Tea');

    // All other cells should be null
    let nullCount = 0;
    for (const day of DAYS_OF_WEEK) {
      for (const meal of MEAL_TYPES) {
        if (!(day === 'Monday' && meal === 'breakfast')) {
          expect(menuMap.get(day)!.get(meal)).toBeNull();
          expect(formatCell(menuMap.get(day)!.get(meal))).toBe('–');
          nullCount++;
        }
      }
    }
    expect(nullCount).toBe(20);
  });

  it('duplicate (day, meal) entries — last write wins (standard Map.set behaviour)', () => {
    const items: FoodMenuItem[] = [
      { branchId: 'test', day: 'Friday', meal: 'lunch', items: ['First'] },
      { branchId: 'test', day: 'Friday', meal: 'lunch', items: ['Second'] },
    ];
    const menuMap = buildFoodMenuMap(items);
    // The second write overwrites the first; value is ['Second']
    expect(menuMap.get('Friday')!.get('lunch')).toEqual(['Second']);
  });
});
