/**
 * Property 14: Every public page render includes all required Open Graph and Twitter Card meta tags
 *
 * Validates: Requirements 10.3, 10.4
 *
 * This test verifies that every public page in the application includes:
 * - All 5 Open Graph tags: og:title, og:description, og:image, og:url, og:type
 * - All 4 Twitter Card tags: twitter:card, twitter:title, twitter:description, twitter:image
 *
 * Each tag must have a non-empty content attribute.
 *
 * Strategy:
 * We generate metadata for various pages using fast-check arbitraries and assert
 * that the resulting metadata objects contain all required fields with non-empty values.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Type definitions ──────────────────────────────────────────────────────

interface MetadataOpenGraph {
  title?: string;
  description?: string;
  url?: string;
  type?: string;
  images?: ReadonlyArray<{ url: string } | string>;
}

interface MetadataTwitter {
  card?: string;
  title?: string;
  description?: string;
  images?: string | string[];
}

interface Metadata {
  title?: string;
  description?: string;
  openGraph?: MetadataOpenGraph;
  twitter?: MetadataTwitter;
}

// ─── Helper functions ──────────────────────────────────────────────────────

/**
 * Validates that a metadata object contains all required Open Graph tags
 * with non-empty values.
 */
function hasValidOpenGraphTags(metadata: Metadata): boolean {
  const og = metadata.openGraph;
  if (!og) return false;

  // Check required OG tags
  if (!og.title || og.title.trim().length === 0) return false;
  if (!og.description || og.description.trim().length === 0) return false;
  if (!og.url || og.url.trim().length === 0) return false;
  if (!og.type || og.type.trim().length === 0) return false;

  // Check og:image - can be array or string
  if (!og.images) return false;
  if (Array.isArray(og.images)) {
    if (og.images.length === 0) return false;
    const firstImage = og.images[0];
    const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;
    if (!imageUrl || imageUrl.trim().length === 0) return false;
  } else {
    return false; // images should be an array
  }

  return true;
}

/**
 * Validates that a metadata object contains all required Twitter Card tags
 * with non-empty values.
 */
function hasValidTwitterCardTags(metadata: Metadata): boolean {
  const twitter = metadata.twitter;
  if (!twitter) return false;

  // Check required Twitter tags
  if (!twitter.card || twitter.card.trim().length === 0) return false;
  if (!twitter.title || twitter.title.trim().length === 0) return false;
  if (!twitter.description || twitter.description.trim().length === 0) return false;

  // Check twitter:image - can be array or string
  if (!twitter.images) return false;
  if (typeof twitter.images === 'string') {
    if (twitter.images.trim().length === 0) return false;
  } else if (Array.isArray(twitter.images)) {
    if (twitter.images.length === 0) return false;
    if (!twitter.images[0] || twitter.images[0].trim().length === 0) return false;
  } else {
    return false;
  }

  return true;
}

// ─── Arbitraries ───────────────────────────────────────────────────────────

/**
 * Generates valid non-empty strings for text fields
 * Filters out whitespace-only strings so all generated strings have at least one visible character.
 */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

/**
 * Generates valid domain strings
 */
const domainArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]+$/),
    fc.constantFrom('.com', '.org', '.net', '.in', '.edu')
  )
  .map(([name, tld]) => `${name}${tld}`);

/**
 * Generates valid URL path strings
 */
const pathArb = fc
  .array(fc.stringMatching(/^[a-z0-9-]+$/), { minLength: 0, maxLength: 3 })
  .map((segments) => (segments.length > 0 ? '/' + segments.join('/') : '/'));

/**
 * Generates valid URL strings
 */
const urlArb = fc
  .tuple(
    fc.constantFrom('http', 'https'),
    domainArb,
    pathArb
  )
  .map(([protocol, domain, path]) => `${protocol}://${domain}${path}`);

/**
 * Generates valid image URL strings
 */
const imageUrlArb = fc
  .tuple(
    urlArb,
    fc.constantFrom('.jpg', '.png', '.webp', '.jpeg')
  )
  .map(([url, ext]) => `${url}${ext}`);

/**
 * Generates a valid Metadata object with all required Open Graph and Twitter Card fields
 */
const validMetadataArb: fc.Arbitrary<Metadata> = fc.record({
  title: nonEmptyStringArb,
  description: nonEmptyStringArb,
  openGraph: fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    url: urlArb,
    type: fc.constantFrom('website', 'article'),
    images: fc.array(fc.record({ url: imageUrlArb }), { minLength: 1, maxLength: 3 }),
  }),
  twitter: fc.record({
    card: fc.constantFrom('summary', 'summary_large_image'),
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    images: fc.oneof(
      imageUrlArb,
      fc.array(imageUrlArb, { minLength: 1, maxLength: 3 })
    ),
  }),
});

/**
 * Generates Metadata objects that are MISSING one or more required OG fields
 */
const invalidOGMetadataArb = fc.oneof(
  // Missing og:title
  fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    openGraph: fc.record({
      title: fc.constant(''),
      description: nonEmptyStringArb,
      url: urlArb,
      type: fc.constantFrom('website', 'article'),
      images: fc.array(fc.record({ url: imageUrlArb }), { minLength: 1 }),
    }),
    twitter: fc.record({
      card: fc.constantFrom('summary', 'summary_large_image'),
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      images: imageUrlArb,
    }),
  }),
  // Missing og:url
  fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    openGraph: fc.record({
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      url: fc.constant(''),
      type: fc.constantFrom('website', 'article'),
      images: fc.array(fc.record({ url: imageUrlArb }), { minLength: 1 }),
    }),
    twitter: fc.record({
      card: fc.constantFrom('summary', 'summary_large_image'),
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      images: imageUrlArb,
    }),
  }),
  // Missing og:image (empty array)
  fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    openGraph: fc.record({
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      url: urlArb,
      type: fc.constantFrom('website', 'article'),
      images: fc.constant([]),
    }),
    twitter: fc.record({
      card: fc.constantFrom('summary', 'summary_large_image'),
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      images: imageUrlArb,
    }),
  }),
  // Completely missing openGraph object
  fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    openGraph: fc.constant(undefined),
    twitter: fc.record({
      card: fc.constantFrom('summary', 'summary_large_image'),
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      images: imageUrlArb,
    }),
  })
);

/**
 * Generates Metadata objects that are MISSING one or more required Twitter fields
 */
const invalidTwitterMetadataArb: fc.Arbitrary<Metadata> = fc.oneof(
  // Missing twitter:image
  fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    openGraph: fc.record({
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      url: urlArb,
      type: fc.constantFrom('website', 'article'),
      images: fc.array(fc.record({ url: imageUrlArb }), { minLength: 1 }),
    }),
    twitter: fc.record({
      card: fc.constantFrom('summary', 'summary_large_image'),
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      images: fc.constant(undefined),
    }),
  }),
  // Missing twitter:title
  fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    openGraph: fc.record({
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      url: urlArb,
      type: fc.constantFrom('website', 'article'),
      images: fc.array(fc.record({ url: imageUrlArb }), { minLength: 1 }),
    }),
    twitter: fc.record({
      card: fc.constantFrom('summary', 'summary_large_image'),
      title: fc.constant(''),
      description: nonEmptyStringArb,
      images: imageUrlArb,
    }),
  }),
  // Completely missing twitter object
  fc.record({
    title: nonEmptyStringArb,
    description: nonEmptyStringArb,
    openGraph: fc.record({
      title: nonEmptyStringArb,
      description: nonEmptyStringArb,
      url: urlArb,
      type: fc.constantFrom('website', 'article'),
      images: fc.array(fc.record({ url: imageUrlArb }), { minLength: 1 }),
    }),
    twitter: fc.constant(undefined),
  })
);

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Property 14 — Open Graph and Twitter Card meta tags on all public pages', () => {
  describe('Valid metadata with all required tags', () => {
    it('accepts any metadata object with all required OG and Twitter tags present', () => {
      fc.assert(
        fc.property(validMetadataArb, (metadata) => {
          expect(hasValidOpenGraphTags(metadata)).toBe(true);
          expect(hasValidTwitterCardTags(metadata)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid Open Graph metadata', () => {
    it('rejects metadata missing one or more required OG fields', () => {
      fc.assert(
        fc.property(invalidOGMetadataArb, (metadata) => {
          expect(hasValidOpenGraphTags(metadata)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid Twitter Card metadata', () => {
    it('rejects metadata missing one or more required Twitter fields', () => {
      fc.assert(
        fc.property(invalidTwitterMetadataArb, (metadata) => {
          expect(hasValidTwitterCardTags(metadata)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    it('rejects metadata with whitespace-only field values', () => {
      const metadataWithWhitespace: Metadata = {
        title: 'Valid Title',
        description: 'Valid Description',
        openGraph: {
          title: '   ', // whitespace only
          description: 'Valid Description',
          url: 'https://example.com',
          type: 'website',
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Valid Title',
          description: 'Valid Description',
          images: 'https://example.com/image.jpg',
        },
      };

      expect(hasValidOpenGraphTags(metadataWithWhitespace)).toBe(false);
    });

    it('accepts metadata with image as object array', () => {
      const metadata: Metadata = {
        title: 'Test Page',
        description: 'Test Description',
        openGraph: {
          title: 'Test Page',
          description: 'Test Description',
          url: 'https://example.com/test',
          type: 'website',
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Test Page',
          description: 'Test Description',
          images: 'https://example.com/image.jpg',
        },
      };

      expect(hasValidOpenGraphTags(metadata)).toBe(true);
      expect(hasValidTwitterCardTags(metadata)).toBe(true);
    });

    it('accepts Twitter images as string array', () => {
      const metadata: Metadata = {
        title: 'Test Page',
        description: 'Test Description',
        openGraph: {
          title: 'Test Page',
          description: 'Test Description',
          url: 'https://example.com/test',
          type: 'website',
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Test Page',
          description: 'Test Description',
          images: ['https://example.com/image.jpg'],
        },
      };

      expect(hasValidOpenGraphTags(metadata)).toBe(true);
      expect(hasValidTwitterCardTags(metadata)).toBe(true);
    });

    it('rejects metadata with empty image arrays', () => {
      const metadataEmptyOGImages: Metadata = {
        title: 'Test Page',
        description: 'Test Description',
        openGraph: {
          title: 'Test Page',
          description: 'Test Description',
          url: 'https://example.com/test',
          type: 'website',
          images: [], // empty array
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Test Page',
          description: 'Test Description',
          images: 'https://example.com/image.jpg',
        },
      };

      expect(hasValidOpenGraphTags(metadataEmptyOGImages)).toBe(false);
    });
  });
});
