// @vitest-environment node
/**
 * Property-based tests for GalleryTabs category filtering logic.
 *
 * **Validates: Requirements 3.2**
 *
 * Property 7: Gallery tab filtering shows only items matching the selected category.
 *
 * Sub-properties:
 *   7a — "All" category always returns all items (same length as input)
 *   7b — A specific category filter returns only items with that exact category
 *   7c — No filtered result contains items from a different category
 *   7d — Filtered count is always ≤ total item count
 *   7e — "all" tab count equals total item count
 *   7f — Empty input always yields empty output for any category
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Types (mirrored from GalleryTabs.tsx) ────────────────────────────────────

type GalleryCategory = 'room' | 'common-area' | 'food' | 'exterior' | 'event';
type FilterCategory = 'all' | 'room' | 'common-area' | 'food' | 'exterior';

interface GalleryItem {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  category: GalleryCategory;
  altText: string;
  branchId: string;
  uploadedAt: string;
}

// ─── Pure filtering function (extracted from GalleryTabs component) ──────────

/**
 * Mirrors the filtering logic used inside GalleryTabs:
 *   - "all" → returns all items unchanged
 *   - any other FilterCategory → returns only items whose category matches
 */
function filterByCategory(items: GalleryItem[], category: FilterCategory): GalleryItem[] {
  return category === 'all' ? items : items.filter((item) => item.category === category);
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** All possible gallery item categories (including 'event' which is not a filter tab) */
const galleryCategories: GalleryCategory[] = [
  'room',
  'common-area',
  'food',
  'exterior',
  'event',
];

/** All possible filter tab categories */
const filterCategories: FilterCategory[] = ['all', 'room', 'common-area', 'food', 'exterior'];

/** Arbitrary for a single GalleryItem */
const galleryItemArb: fc.Arbitrary<GalleryItem> = fc.record({
  _id: fc.uuid(),
  url: fc.webUrl(),
  publicId: fc.string({ minLength: 1, maxLength: 60 }),
  resourceType: fc.constantFrom<'image' | 'video'>('image', 'video'),
  category: fc.constantFrom(...galleryCategories),
  altText: fc.string({ minLength: 3, maxLength: 200 }),
  branchId: fc.string({ minLength: 1, maxLength: 40 }),
  uploadedAt: fc.constantFrom(
    '2023-01-01T00:00:00.000Z',
    '2024-06-15T12:30:00.000Z',
    '2025-12-31T23:59:59.000Z',
  ),
});

/** Arbitrary for an array of GalleryItems (0–50 items) */
const galleryItemsArb: fc.Arbitrary<GalleryItem[]> = fc.array(galleryItemArb, {
  minLength: 0,
  maxLength: 50,
});

/** Arbitrary for a non-empty array of GalleryItems (1–50 items) */
const nonEmptyGalleryItemsArb: fc.Arbitrary<GalleryItem[]> = fc.array(galleryItemArb, {
  minLength: 1,
  maxLength: 50,
});

/** Arbitrary for any FilterCategory */
const filterCategoryArb: fc.Arbitrary<FilterCategory> = fc.constantFrom(...filterCategories);

/** Arbitrary for a specific (non-"all") FilterCategory */
const specificFilterCategoryArb: fc.Arbitrary<Exclude<FilterCategory, 'all'>> = fc.constantFrom<
  Exclude<FilterCategory, 'all'>
>('room', 'common-area', 'food', 'exterior');

// ─── Property 7a — "all" returns every item (same length) ────────────────────

describe('Property 7a — "all" category returns all items', () => {
  it('filterByCategory with "all" always returns the same number of items as the input', () => {
    fc.assert(
      fc.property(galleryItemsArb, (items) => {
        const result = filterByCategory(items, 'all');
        expect(result.length).toBe(items.length);
      }),
      { numRuns: 200 },
    );
  });

  it('filterByCategory with "all" returns the exact same item references', () => {
    fc.assert(
      fc.property(galleryItemsArb, (items) => {
        const result = filterByCategory(items, 'all');
        expect(result).toBe(items);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 7b — specific category returns only matching items ──────────────

describe('Property 7b — specific category filter returns only items with that category', () => {
  it('every item in the filtered result has category === the selected FilterCategory', () => {
    fc.assert(
      fc.property(galleryItemsArb, specificFilterCategoryArb, (items, category) => {
        const result = filterByCategory(items, category);
        for (const item of result) {
          expect(item.category).toBe(category);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 7c — no filtered result contains items from a different category

describe('Property 7c — no filtered result contains items from a different category', () => {
  it('filtered items never include an item whose category differs from the selected filter', () => {
    fc.assert(
      fc.property(galleryItemsArb, specificFilterCategoryArb, (items, category) => {
        const result = filterByCategory(items, category);
        const wrongCategory = result.filter((item) => item.category !== category);
        expect(wrongCategory.length).toBe(0);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 7d — filtered count ≤ total count ──────────────────────────────

describe('Property 7d — filtered count is always ≤ total item count', () => {
  it('result length never exceeds input length for any filter category', () => {
    fc.assert(
      fc.property(galleryItemsArb, filterCategoryArb, (items, category) => {
        const result = filterByCategory(items, category);
        expect(result.length).toBeLessThanOrEqual(items.length);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 7e — "all" tab count equals total item count ───────────────────

describe('Property 7e — "all" tab count always equals total item count', () => {
  it('filterByCategory("all") length equals input.length for any non-empty item array', () => {
    fc.assert(
      fc.property(nonEmptyGalleryItemsArb, (items) => {
        const result = filterByCategory(items, 'all');
        expect(result.length).toBe(items.length);
      }),
      { numRuns: 200 },
    );
  });
});

// ─── Property 7f — empty input always yields empty output ────────────────────

describe('Property 7f — empty input always yields empty output for any category', () => {
  it('filterByCategory returns [] for any category when items is empty', () => {
    fc.assert(
      fc.property(filterCategoryArb, (category) => {
        const result = filterByCategory([], category);
        expect(result.length).toBe(0);
        expect(result).toEqual([]);
      }),
      { numRuns: 50 },
    );
  });
});

// ─── Additional deterministic edge cases ─────────────────────────────────────

describe('Deterministic edge cases for filterByCategory', () => {
  const sampleItems: GalleryItem[] = [
    {
      _id: '1',
      url: 'https://example.com/1.jpg',
      publicId: 'pub1',
      resourceType: 'image',
      category: 'room',
      altText: 'A room photo',
      branchId: 'ln-main',
      uploadedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      _id: '2',
      url: 'https://example.com/2.jpg',
      publicId: 'pub2',
      resourceType: 'image',
      category: 'food',
      altText: 'A food photo',
      branchId: 'ln-main',
      uploadedAt: '2024-01-02T00:00:00.000Z',
    },
    {
      _id: '3',
      url: 'https://example.com/3.jpg',
      publicId: 'pub3',
      resourceType: 'image',
      category: 'common-area',
      altText: 'A common area photo',
      branchId: 'ln-main',
      uploadedAt: '2024-01-03T00:00:00.000Z',
    },
    {
      _id: '4',
      url: 'https://example.com/4.jpg',
      publicId: 'pub4',
      resourceType: 'video',
      category: 'exterior',
      altText: 'An exterior video',
      branchId: 'ln-main',
      uploadedAt: '2024-01-04T00:00:00.000Z',
    },
    {
      _id: '5',
      url: 'https://example.com/5.jpg',
      publicId: 'pub5',
      resourceType: 'image',
      category: 'room',
      altText: 'Another room photo',
      branchId: 'ln-main',
      uploadedAt: '2024-01-05T00:00:00.000Z',
    },
  ];

  it('"all" returns all 5 items', () => {
    expect(filterByCategory(sampleItems, 'all').length).toBe(5);
  });

  it('"room" returns 2 items', () => {
    const result = filterByCategory(sampleItems, 'room');
    expect(result.length).toBe(2);
    expect(result.every((i) => i.category === 'room')).toBe(true);
  });

  it('"food" returns 1 item', () => {
    const result = filterByCategory(sampleItems, 'food');
    expect(result.length).toBe(1);
    expect(result[0].category).toBe('food');
  });

  it('"common-area" returns 1 item', () => {
    const result = filterByCategory(sampleItems, 'common-area');
    expect(result.length).toBe(1);
    expect(result[0].category).toBe('common-area');
  });

  it('"exterior" returns 1 item', () => {
    const result = filterByCategory(sampleItems, 'exterior');
    expect(result.length).toBe(1);
    expect(result[0].category).toBe('exterior');
  });

  it('category with zero matching items (e.g. "exterior" on room-only list) returns []', () => {
    const roomOnly = sampleItems.filter((i) => i.category === 'room');
    const result = filterByCategory(roomOnly, 'exterior');
    expect(result).toEqual([]);
  });
});
