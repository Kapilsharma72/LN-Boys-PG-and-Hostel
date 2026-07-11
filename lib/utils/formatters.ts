/**
 * Utility functions for formatting data across the LN Boys PG & Hostel website.
 * 
 * - formatINR: Format numbers as Indian Rupees
 * - formatDate: Format dates for display
 * - buildFoodMenuMap: Build a 7-day × 3-meal Map structure from FoodMenu collection items
 */

/**
 * Format a number as Indian Rupees (INR) with proper locale formatting.
 * 
 * @param amount - The numeric amount to format (e.g., 8000, 12500.50)
 * @returns Formatted string with ₹ symbol and Indian locale formatting (e.g., "₹8,000", "₹12,500.50")
 * 
 * @example
 * formatINR(8000) // "₹8,000"
 * formatINR(12500.50) // "₹12,500.50"
 */
export function formatINR(amount: number): string {
  // Show 2 decimal places only when the amount has a fractional part;
  // whole numbers are displayed without any decimals (e.g., ₹8,000 not ₹8,000.00).
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date for display in a human-readable format.
 * 
 * @param date - The date to format (Date object or ISO 8601 string)
 * @returns Formatted date string in "DD MMM YYYY" format (e.g., "15 Mar 2024")
 * 
 * @example
 * formatDate(new Date('2024-03-15')) // "15 Mar 2024"
 * formatDate('2024-03-15T10:30:00.000Z') // "15 Mar 2024"
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Type definition for a FoodMenu item from the database.
 * Matches the FoodMenu schema from lib/db/models/FoodMenu.ts
 */
export interface FoodMenuItem {
  branchId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  meal: 'breakfast' | 'lunch' | 'dinner';
  items: string[];
}

/**
 * Days of the week in order for food menu display.
 */
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/**
 * Meal types in display order (breakfast → lunch → dinner).
 */
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

/**
 * Build a nested Map structure for the food menu table: Map<day, Map<meal, string[]>>.
 * 
 * This creates a complete 7-day × 3-meal grid (21 cells total) where:
 * - Each day maps to a Map of meals
 * - Each meal maps to an array of food item strings
 * - Missing entries (no data in database) map to null, so the UI can render "–"
 * 
 * @param items - Array of FoodMenu documents from MongoDB
 * @returns A Map with all 7 days, each containing a Map with all 3 meals
 * 
 * @example
 * const menuItems = [
 *   { branchId: 'ln-vidhani', day: 'Monday', meal: 'breakfast', items: ['Poha', 'Tea'] },
 *   { branchId: 'ln-vidhani', day: 'Monday', meal: 'lunch', items: ['Dal', 'Rice', 'Roti'] },
 * ];
 * const menuMap = buildFoodMenuMap(menuItems);
 * 
 * // Access: menuMap.get('Monday')?.get('breakfast') → ['Poha', 'Tea']
 * // Missing: menuMap.get('Monday')?.get('dinner') → null
 */
export function buildFoodMenuMap(items: FoodMenuItem[]): Map<string, Map<string, string[] | null>> {
  // Initialize the complete 7×3 grid with all days and meals set to null
  const menuMap = new Map<string, Map<string, string[] | null>>();
  
  for (const day of DAYS_OF_WEEK) {
    const mealMap = new Map<string, string[] | null>();
    for (const meal of MEAL_TYPES) {
      mealMap.set(meal, null);
    }
    menuMap.set(day, mealMap);
  }
  
  // Populate the map with actual data from the items array
  for (const item of items) {
    const dayMap = menuMap.get(item.day);
    if (dayMap) {
      dayMap.set(item.meal, item.items);
    }
  }
  
  return menuMap;
}
