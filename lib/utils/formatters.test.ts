/**
 * Unit tests for formatter utilities
 * 
 * Tests cover:
 * - formatINR: Indian Rupee formatting
 * - formatDate: Date formatting
 * - buildFoodMenuMap: 7-day × 3-meal Map builder
 */

import { describe, it, expect } from 'vitest';
import { formatINR, formatDate, buildFoodMenuMap, type FoodMenuItem } from './formatters';

describe('formatINR', () => {
  it('formats whole numbers with comma separators', () => {
    expect(formatINR(8000)).toBe('₹8,000');
    expect(formatINR(12500)).toBe('₹12,500');
    expect(formatINR(100000)).toBe('₹1,00,000');
  });

  it('formats decimal amounts correctly', () => {
    expect(formatINR(8000.50)).toBe('₹8,000.50');
    expect(formatINR(12500.99)).toBe('₹12,500.99');
  });

  it('handles zero amount', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('handles very small amounts', () => {
    expect(formatINR(0.01)).toBe('₹0.01');
    expect(formatINR(1)).toBe('₹1');
  });

  it('handles very large amounts', () => {
    expect(formatINR(999999)).toBe('₹9,99,999');
    expect(formatINR(1000000)).toBe('₹10,00,000');
  });

  it('rounds to 2 decimal places when necessary', () => {
    expect(formatINR(8000.505)).toBe('₹8,000.51');
    expect(formatINR(8000.504)).toBe('₹8,000.50');
  });

  it('does not show decimals for whole number amounts', () => {
    expect(formatINR(8000.00)).toBe('₹8,000');
  });
});

describe('formatDate', () => {
  it('formats Date objects correctly', () => {
    const date = new Date('2024-03-15T10:30:00.000Z');
    const formatted = formatDate(date);
    expect(formatted).toMatch(/15 Mar 2024/);
  });

  it('formats ISO 8601 string dates correctly', () => {
    const formatted = formatDate('2024-03-15T10:30:00.000Z');
    expect(formatted).toMatch(/15 Mar 2024/);
  });

  it('handles different months', () => {
    expect(formatDate('2024-01-01')).toMatch(/01 Jan 2024/);
    expect(formatDate('2024-06-15')).toMatch(/15 Jun 2024/);
    expect(formatDate('2024-12-31')).toMatch(/31 Dec 2024/);
  });

  it('handles different years', () => {
    expect(formatDate('2023-03-15')).toMatch(/15 Mar 2023/);
    expect(formatDate('2025-03-15')).toMatch(/15 Mar 2025/);
  });

  it('formats single-digit days with leading zero', () => {
    const formatted = formatDate('2024-03-05');
    expect(formatted).toMatch(/05 Mar 2024/);
  });
});

describe('buildFoodMenuMap', () => {
  it('creates a map with all 7 days and 3 meals initialized to null when given empty array', () => {
    const menuMap = buildFoodMenuMap([]);
    
    expect(menuMap.size).toBe(7);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['breakfast', 'lunch', 'dinner'];
    
    for (const day of days) {
      expect(menuMap.has(day)).toBe(true);
      const dayMap = menuMap.get(day);
      expect(dayMap).toBeDefined();
      expect(dayMap?.size).toBe(3);
      
      for (const meal of meals) {
        expect(dayMap?.has(meal)).toBe(true);
        expect(dayMap?.get(meal)).toBeNull();
      }
    }
  });

  it('populates menu items correctly while keeping missing entries as null', () => {
    const items: FoodMenuItem[] = [
      { branchId: 'ln-vidhani', day: 'Monday', meal: 'breakfast', items: ['Poha', 'Tea'] },
      { branchId: 'ln-vidhani', day: 'Monday', meal: 'lunch', items: ['Dal', 'Rice', 'Roti'] },
      { branchId: 'ln-vidhani', day: 'Tuesday', meal: 'breakfast', items: ['Paratha', 'Curd'] },
    ];
    
    const menuMap = buildFoodMenuMap(items);
    
    // Check populated items
    expect(menuMap.get('Monday')?.get('breakfast')).toEqual(['Poha', 'Tea']);
    expect(menuMap.get('Monday')?.get('lunch')).toEqual(['Dal', 'Rice', 'Roti']);
    expect(menuMap.get('Tuesday')?.get('breakfast')).toEqual(['Paratha', 'Curd']);
    
    // Check missing items are still null
    expect(menuMap.get('Monday')?.get('dinner')).toBeNull();
    expect(menuMap.get('Tuesday')?.get('lunch')).toBeNull();
    expect(menuMap.get('Tuesday')?.get('dinner')).toBeNull();
    expect(menuMap.get('Wednesday')?.get('breakfast')).toBeNull();
    expect(menuMap.get('Sunday')?.get('dinner')).toBeNull();
  });

  it('handles a complete week menu (all 21 cells populated)', () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const meals = ['breakfast', 'lunch', 'dinner'] as const;
    
    const items: FoodMenuItem[] = [];
    for (const day of days) {
      for (const meal of meals) {
        items.push({
          branchId: 'ln-vidhani',
          day,
          meal,
          items: [`${day} ${meal} item`],
        });
      }
    }
    
    const menuMap = buildFoodMenuMap(items);
    
    // Verify all 21 cells are populated
    for (const day of days) {
      for (const meal of meals) {
        expect(menuMap.get(day)?.get(meal)).toEqual([`${day} ${meal} item`]);
      }
    }
  });

  it('handles single day with all three meals', () => {
    const items: FoodMenuItem[] = [
      { branchId: 'ln-vidhani', day: 'Friday', meal: 'breakfast', items: ['Upma'] },
      { branchId: 'ln-vidhani', day: 'Friday', meal: 'lunch', items: ['Biryani'] },
      { branchId: 'ln-vidhani', day: 'Friday', meal: 'dinner', items: ['Paneer'] },
    ];
    
    const menuMap = buildFoodMenuMap(items);
    
    expect(menuMap.get('Friday')?.get('breakfast')).toEqual(['Upma']);
    expect(menuMap.get('Friday')?.get('lunch')).toEqual(['Biryani']);
    expect(menuMap.get('Friday')?.get('dinner')).toEqual(['Paneer']);
    
    // Other days should still have null entries
    expect(menuMap.get('Monday')?.get('breakfast')).toBeNull();
  });

  it('handles multiple items for a single meal', () => {
    const items: FoodMenuItem[] = [
      {
        branchId: 'ln-vidhani',
        day: 'Wednesday',
        meal: 'lunch',
        items: ['Dal Tadka', 'Jeera Rice', 'Roti', 'Salad', 'Pickle'],
      },
    ];
    
    const menuMap = buildFoodMenuMap(items);
    
    expect(menuMap.get('Wednesday')?.get('lunch')).toEqual([
      'Dal Tadka',
      'Jeera Rice',
      'Roti',
      'Salad',
      'Pickle',
    ]);
  });

  it('handles empty items array for a meal (edge case)', () => {
    const items: FoodMenuItem[] = [
      { branchId: 'ln-vidhani', day: 'Saturday', meal: 'dinner', items: [] },
    ];
    
    const menuMap = buildFoodMenuMap(items);
    
    // Empty array should still be set (not null)
    expect(menuMap.get('Saturday')?.get('dinner')).toEqual([]);
  });

  it('overwrites duplicate entries (last entry wins)', () => {
    const items: FoodMenuItem[] = [
      { branchId: 'ln-vidhani', day: 'Monday', meal: 'breakfast', items: ['First'] },
      { branchId: 'ln-vidhani', day: 'Monday', meal: 'breakfast', items: ['Second'] },
    ];
    
    const menuMap = buildFoodMenuMap(items);
    
    // Last entry should win
    expect(menuMap.get('Monday')?.get('breakfast')).toEqual(['Second']);
  });

  it('maintains correct structure with mixed data', () => {
    const items: FoodMenuItem[] = [
      { branchId: 'ln-vidhani', day: 'Monday', meal: 'breakfast', items: ['A'] },
      { branchId: 'ln-vidhani', day: 'Wednesday', meal: 'lunch', items: ['B'] },
      { branchId: 'ln-vidhani', day: 'Friday', meal: 'dinner', items: ['C'] },
      { branchId: 'ln-vidhani', day: 'Sunday', meal: 'breakfast', items: ['D'] },
    ];
    
    const menuMap = buildFoodMenuMap(items);
    
    // Map should still have all 7 days × 3 meals = 21 entries
    expect(menuMap.size).toBe(7);
    for (const [, dayMap] of menuMap) {
      expect(dayMap.size).toBe(3);
    }
    
    // Check specific populated items
    expect(menuMap.get('Monday')?.get('breakfast')).toEqual(['A']);
    expect(menuMap.get('Wednesday')?.get('lunch')).toEqual(['B']);
    expect(menuMap.get('Friday')?.get('dinner')).toEqual(['C']);
    expect(menuMap.get('Sunday')?.get('breakfast')).toEqual(['D']);
    
    // Check random missing items
    expect(menuMap.get('Tuesday')?.get('breakfast')).toBeNull();
    expect(menuMap.get('Thursday')?.get('dinner')).toBeNull();
  });
});
