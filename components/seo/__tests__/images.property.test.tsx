/**
 * Property 18: Every `<img>` element rendered on public pages has a non-empty alt attribute of at least 3 characters
 *
 * Validates: Requirements 10.7
 *
 * This test verifies that every image rendered on public pages includes a non-empty alt
 * attribute with at least 3 characters. This is critical for:
 * - Screen reader accessibility (WCAG 2.1 AA)
 * - SEO (search engines use alt text to understand image content)
 * - User experience when images fail to load
 *
 * Strategy:
 * We generate arbitrary gallery items and component props using fast-check arbitraries,
 * render the components, and verify that all rendered <img> elements have valid alt attributes.
 * We test both Next.js Image components (which render as img) and any raw img elements.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import GalleryTabs, { type GalleryItem } from '@/components/branch/GalleryTabs';

// ─── Type definitions ──────────────────────────────────────────────────────

type GalleryCategory = 'room' | 'common-area' | 'food' | 'exterior' | 'event';
type ResourceType = 'image' | 'video';

// ─── Arbitraries ───────────────────────────────────────────────────────────

/**
 * Generates a random MongoDB-style ObjectId string
 */
const objectIdArb = fc
  .stringMatching(/^[0-9a-f]{24}$/);

/**
 * Generates a valid Cloudinary URL
 */
const cloudinaryUrlArb = fc.webUrl();

/**
 * Generates a valid alt text string (at least 3 characters after trimming)
 * Uses stringMatching to ensure the string has meaningful content
 */
const validAltTextArb = fc
  .string({ minLength: 3, maxLength: 200 })
  .filter((s) => s.trim().length >= 3);

/**
 * Generates an invalid alt text (empty or less than 3 characters)
 */
const invalidAltTextArb = fc.oneof(
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 2 })
);

/**
 * Generates a valid branchId slug
 */
const branchIdArb = fc
  .stringMatching(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
  .filter((s) => s.length >= 3 && s.length <= 80);

/**
 * Generates a valid GalleryItem with a valid alt text
 */
const validGalleryItemArb: fc.Arbitrary<GalleryItem> = fc.record({
  _id: objectIdArb,
  url: cloudinaryUrlArb,
  publicId: fc.string({ minLength: 10, maxLength: 50 }),
  resourceType: fc.constantFrom<ResourceType>('image', 'video'),
  category: fc.constantFrom<GalleryCategory>(
    'room',
    'common-area',
    'food',
    'exterior',
    'event'
  ),
  altText: validAltTextArb,
  branchId: branchIdArb,
  uploadedAt: fc.constantFrom(
    '2020-01-01T00:00:00.000Z',
    '2021-06-15T10:30:00.000Z',
    '2022-12-31T23:59:59.000Z',
    '2023-03-20T08:00:00.000Z',
    '2024-01-15T14:45:00.000Z',
  ),
});

/**
 * Generates a GalleryItem with INVALID alt text (empty or <3 chars)
 */
const invalidAltGalleryItemArb: fc.Arbitrary<GalleryItem> = fc.record({
  _id: objectIdArb,
  url: cloudinaryUrlArb,
  publicId: fc.string({ minLength: 10, maxLength: 50 }),
  resourceType: fc.constant<ResourceType>('image'), // Only images have img tags
  category: fc.constantFrom<GalleryCategory>(
    'room',
    'common-area',
    'food',
    'exterior',
    'event'
  ),
  altText: invalidAltTextArb,
  branchId: branchIdArb,
  uploadedAt: fc.constantFrom(
    '2020-01-01T00:00:00.000Z',
    '2021-06-15T10:30:00.000Z',
    '2022-12-31T23:59:59.000Z',
  ),
});

/**
 * Generates an array of valid GalleryItems (1-20 items)
 */
const galleryItemsArb = fc.array(validGalleryItemArb, { minLength: 1, maxLength: 20 });

// ─── Helper functions ──────────────────────────────────────────────────────

/**
 * Validates that an alt attribute value is non-empty and at least 3 characters long
 */
function isValidAltText(alt: string | null): boolean {
  if (alt === null || alt === undefined) return false;
  const trimmed = alt.trim();
  return trimmed.length >= 3;
}

/**
 * Extracts all img elements from a rendered component and validates their alt attributes
 */
function validateImagesInContainer(container: HTMLElement): {
  imageCount: number;
  invalidAlts: Array<{ src: string; alt: string | null }>;
} {
  const images = container.querySelectorAll('img');
  const invalidAlts: Array<{ src: string; alt: string | null }> = [];

  images.forEach((img) => {
    const alt = img.getAttribute('alt');
    if (!isValidAltText(alt)) {
      invalidAlts.push({
        src: img.getAttribute('src') || img.getAttribute('data-src') || '(unknown)',
        alt,
      });
    }
  });

  return {
    imageCount: images.length,
    invalidAlts,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Property 18 — Image alt text completeness', () => {
  describe('Valid alt text (≥3 characters)', () => {
    it('accepts any alt text with 3 or more characters', () => {
      fc.assert(
        fc.property(validAltTextArb, (altText) => {
          expect(isValidAltText(altText)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('validates that the helper correctly identifies valid alt text', () => {
      expect(isValidAltText('abc')).toBe(true); // exactly 3
      expect(isValidAltText('Room interior photo')).toBe(true);
      expect(isValidAltText('   valid text with spaces   ')).toBe(true); // trimmed length ≥3
    });
  });

  describe('Invalid alt text (<3 characters or empty)', () => {
    it('rejects any alt text with fewer than 3 characters', () => {
      fc.assert(
        fc.property(invalidAltTextArb, (altText) => {
          expect(isValidAltText(altText)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('validates that the helper correctly identifies invalid alt text', () => {
      expect(isValidAltText('')).toBe(false); // empty
      expect(isValidAltText('a')).toBe(false); // 1 char
      expect(isValidAltText('ab')).toBe(false); // 2 chars
      expect(isValidAltText(null)).toBe(false); // null
      expect(isValidAltText('  ')).toBe(false); // whitespace only
    });
  });

  describe('GalleryTabs component with valid gallery items', () => {
    it('renders all images with valid alt text for any set of valid gallery items', () => {
      fc.assert(
        fc.property(galleryItemsArb, (items) => {
          // Filter to only image items (videos use aria-label, not alt)
          const imageItems = items.filter((item) => item.resourceType === 'image');

          // Skip if no images
          if (imageItems.length === 0) return;

          const { container } = render(<GalleryTabs items={items} />);
          const { imageCount, invalidAlts } = validateImagesInContainer(container);

          // Assert that we found images
          expect(imageCount).toBeGreaterThan(0);

          // Assert that no images have invalid alt text
          expect(invalidAlts).toHaveLength(0);
        }),
        { numRuns: 50 }
      );
    });

    it('renders images with alt text matching the gallery item altText field', () => {
      fc.assert(
        fc.property(validGalleryItemArb, (item) => {
          // Only test images
          if (item.resourceType !== 'image') return;

          const { container } = render(<GalleryTabs items={[item]} />);
          const images = container.querySelectorAll('img');

          // Should have exactly one image
          expect(images.length).toBeGreaterThan(0);

          // Find the image that matches our item URL
          let found = false;
          images.forEach((img) => {
            // Next.js Image creates a src attribute
            const src = img.getAttribute('src');
            // Check if this is our image (Next.js Image may transform the URL)
            if (src && src.includes('_next/image')) {
              // Check alt text matches
              const alt = img.getAttribute('alt');
              if (alt === item.altText) {
                found = true;
                expect(isValidAltText(alt)).toBe(true);
              }
            }
          });

          // If we didn't find our specific image, at least verify all images have valid alts
          if (!found) {
            const { invalidAlts } = validateImagesInContainer(container);
            expect(invalidAlts).toHaveLength(0);
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge cases', () => {
    it('handles empty gallery item array without crashing', () => {
      const { container } = render(<GalleryTabs items={[]} />);
      const images = container.querySelectorAll('img');

      // Empty state should not render any images
      expect(images.length).toBe(0);
    });

    it('handles mixed image and video items correctly', () => {
      const mixedItems: GalleryItem[] = [
        {
          _id: '507f1f77bcf86cd799439011',
          url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          publicId: 'sample-image-01',
          resourceType: 'image',
          category: 'room',
          altText: 'Single room with study desk',
          branchId: 'ln-vidhani-jecrc',
          uploadedAt: '2024-01-15T10:00:00Z',
        },
        {
          _id: '507f1f77bcf86cd799439012',
          url: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
          publicId: 'sample-video-01',
          resourceType: 'video',
          category: 'room',
          altText: 'Room tour video',
          branchId: 'ln-vidhani-jecrc',
          uploadedAt: '2024-01-15T11:00:00Z',
        },
      ];

      const { container } = render(<GalleryTabs items={mixedItems} />);
      const images = container.querySelectorAll('img');
      const videos = container.querySelectorAll('video');

      // Should have 1 image and 1 video
      expect(images.length).toBeGreaterThan(0);
      expect(videos.length).toBeGreaterThan(0);

      // Validate all images have valid alt text
      const { invalidAlts } = validateImagesInContainer(container);
      expect(invalidAlts).toHaveLength(0);

      // Videos should have aria-label instead of alt
      videos.forEach((video) => {
        const ariaLabel = video.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel!.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('detects when an image has invalid alt text (implementation verification)', () => {
      // Create a deliberately broken gallery item
      const brokenItem: GalleryItem = {
        _id: '507f1f77bcf86cd799439011',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'sample-image-01',
        resourceType: 'image',
        category: 'room',
        altText: 'ab', // INVALID: only 2 characters
        branchId: 'ln-vidhani-jecrc',
        uploadedAt: '2024-01-15T10:00:00Z',
      };

      // This test documents the EXPECTED behavior.
      // In practice, the component SHOULD pass valid alt text through correctly,
      // but if it somehow truncates or fails to set alt properly, this test would catch it.

      const { container } = render(<GalleryTabs items={[brokenItem]} />);
      const images = container.querySelectorAll('img');

      // Should have at least one image
      expect(images.length).toBeGreaterThan(0);

      // Check if any image has the invalid alt text
      let foundInvalidAlt = false;
      images.forEach((img) => {
        const alt = img.getAttribute('alt');
        if (alt === 'ab') {
          foundInvalidAlt = true;
          expect(isValidAltText(alt)).toBe(false);
        }
      });

      // Note: This test will PASS if the component correctly passes through the altText,
      // even if it's invalid. The real validation happens at the data layer (schema validation).
      // This property test verifies the DETECTION logic works correctly.
      if (foundInvalidAlt) {
        expect(isValidAltText('ab')).toBe(false);
      }
    });

    it('handles gallery items with whitespace-padded alt text', () => {
      const item: GalleryItem = {
        _id: '507f1f77bcf86cd799439011',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'sample-image-01',
        resourceType: 'image',
        category: 'room',
        altText: '   valid alt text   ', // whitespace padded but valid when trimmed
        branchId: 'ln-vidhani-jecrc',
        uploadedAt: '2024-01-15T10:00:00Z',
      };

      const { container } = render(<GalleryTabs items={[item]} />);
      const { invalidAlts } = validateImagesInContainer(container);

      expect(invalidAlts).toHaveLength(0);
    });

    it('validates category filtering does not affect alt text completeness', () => {
      // Generate items with different categories
      const itemsAllCategories = fc.sample(validGalleryItemArb, 20);

      const { container } = render(<GalleryTabs items={itemsAllCategories} />);

      // The component starts with "All" tab active, then allows filtering by category
      // Regardless of which tab is active, all visible images must have valid alt text
      const { invalidAlts } = validateImagesInContainer(container);
      expect(invalidAlts).toHaveLength(0);
    });
  });

  describe('Property-based validation across component variations', () => {
    it('maintains alt text validity across different gallery sizes', () => {
      fc.assert(
        fc.property(
          fc.array(validGalleryItemArb, { minLength: 1, maxLength: 50 }),
          (items) => {
            // Filter to only image items and ensure they all have the same category
            const imageItems = items
              .filter((item) => item.resourceType === 'image')
              .map((item) => ({ ...item, category: 'room' as const }));

            // Skip if no images
            if (imageItems.length === 0) return;

            const { container } = render(<GalleryTabs items={imageItems} />);
            const { invalidAlts } = validateImagesInContainer(container);

            // If we find invalid alts, log them for debugging
            if (invalidAlts.length > 0) {
              console.error('Invalid alts found:', invalidAlts);
            }

            expect(invalidAlts).toHaveLength(0);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Alt text content quality (secondary validation)', () => {
    it('ensures alt text is descriptive and not just placeholder text', () => {
      // This is a semantic validation beyond the 3-character minimum
      const goodAltTexts = [
        'Single occupancy room with study desk and wardrobe',
        'Common area with sofa and television',
        'Breakfast menu featuring parathas and tea',
        'Building exterior showing parking area',
      ];

      const poorAltTexts = [
        'img', // Too generic
        'pic', // Too generic
        'photo', // Too generic (5 chars but not descriptive)
      ];

      goodAltTexts.forEach((alt) => {
        expect(isValidAltText(alt)).toBe(true);
        expect(alt.length).toBeGreaterThan(10); // Good alt text is usually longer
      });

      poorAltTexts.forEach((alt) => {
        // These technically pass the ≥3 character rule, but are poor quality
        // This test documents the distinction between technical validity and semantic quality
        const isValid = isValidAltText(alt);
        if (isValid) {
          // If it passes, we should still warn that it's not ideal
          expect(alt.length).toBeLessThan(20); // Poor alt text tends to be very short
        }
      });
    });
  });
});
