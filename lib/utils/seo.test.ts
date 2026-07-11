/**
 * Unit tests for SEO utility functions
 * 
 * Tests the title generation and metadata helpers against the design patterns.
 */

import { describe, it, expect } from 'vitest';
import { generateBranchTitle, generatePageMeta, generateHeroAlt, generateTrustIconAlt, BranchForSEO, PostForSEO } from './seo';

// Local convenience types that match what generatePageMeta actually returns,
// avoiding direct use of Next.js Metadata internals that have stricter typings.
interface OGMeta {
  title?: string | null;
  description?: string | null;
  url?: string | URL | null;
  type?: string | null;
  images?: Array<{ url: string }> | null;
}
interface TwitterMeta {
  card?: string | null;
  title?: string | null;
  description?: string | null;
  images?: string | string[] | null;
}
interface PageMeta {
  title?: string | null;
  description?: string | null;
  openGraph?: OGMeta | null;
  twitter?: TwitterMeta | null;
}

function asMeta(m: unknown): PageMeta {
  return m as PageMeta;
}

describe('SEO Utilities', () => {
  describe('generateBranchTitle', () => {
    it('should generate title following the pattern: [Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel', () => {
      const branch: BranchForSEO = {
        branchId: 'ln-vidhani-jecrc',
        name: 'LN Boys PG & Hostel - Vidhani (JECRC)',
        city: 'Jaipur',
        startingPrice: 8000,
      };
      
      const title = generateBranchTitle(branch, 'JECRC');
      
      expect(title).toBe('LN Boys PG & Hostel - Vidhani (JECRC) | Best Boys PG near JECRC, Jaipur | LN Boys PG & Hostel');
    });

    it('should handle different branch names and landmarks', () => {
      const branch: BranchForSEO = {
        branchId: 'ln-malviya-nagar',
        name: 'LN Boys PG - Malviya Nagar',
        city: 'Jaipur',
        startingPrice: 7500,
      };
      
      const title = generateBranchTitle(branch, 'Malviya Nagar Metro');
      
      expect(title).toBe('LN Boys PG - Malviya Nagar | Best Boys PG near Malviya Nagar Metro, Jaipur | LN Boys PG & Hostel');
    });
  });

  describe('generatePageMeta', () => {
    it('should generate home page metadata with correct title pattern', () => {
      const meta = asMeta(generatePageMeta('home'));
      
      expect(meta.title).toBe('Best Boys PG & Hostel in Jaipur | LN Boys PG & Hostel');
      expect(meta.description).toBeDefined();
      expect(meta.openGraph?.title).toBe('Best Boys PG & Hostel in Jaipur | LN Boys PG & Hostel');
      expect(meta.openGraph?.url).toBe('https://lnboyspg.in');
      expect(meta.twitter?.card).toBe('summary_large_image');
    });

    it('should generate branch page metadata with correct title pattern', () => {
      const branch: BranchForSEO = {
        branchId: 'ln-vidhani-jecrc',
        name: 'LN Boys PG & Hostel - Vidhani (JECRC)',
        city: 'Jaipur',
        startingPrice: 8000,
        metaDescription: 'Premium PG near JECRC with all amenities',
      };
      
      const meta = asMeta(generatePageMeta('branch', { branch, landmark: 'JECRC' }));
      
      expect(meta.title).toBe('LN Boys PG & Hostel - Vidhani (JECRC) | Best Boys PG near JECRC, Jaipur | LN Boys PG & Hostel');
      expect(meta.description).toBe('Premium PG near JECRC with all amenities');
      expect(meta.openGraph?.url).toBe('https://lnboyspg.in/branch/ln-vidhani-jecrc');
    });

    it('should use fallback description when branch metaDescription is null', () => {
      const branch: BranchForSEO = {
        branchId: 'ln-test',
        name: 'Test Branch',
        city: 'Jaipur',
        startingPrice: 9000,
        metaDescription: null,
      };
      
      const meta = asMeta(generatePageMeta('branch', { branch, landmark: 'Test Area' }));
      
      expect(meta.description).toBe('Affordable PG & hostel accommodation at Test Branch. Starting ₹9000/month.');
    });

    it('should generate locations page metadata with correct title pattern', () => {
      const meta = asMeta(generatePageMeta('locations'));
      
      expect(meta.title).toBe('All PG & Hostel Locations in Jaipur | LN Boys PG & Hostel');
      expect(meta.openGraph?.url).toBe('https://lnboyspg.in/locations');
    });

    it('should generate about page metadata with correct title pattern', () => {
      const meta = asMeta(generatePageMeta('about'));
      
      expect(meta.title).toBe('About Us | LN Boys PG & Hostel, Jaipur');
      expect(meta.openGraph?.url).toBe('https://lnboyspg.in/about');
    });

    it('should generate contact page metadata with correct title pattern', () => {
      const meta = asMeta(generatePageMeta('contact'));
      
      expect(meta.title).toBe('Contact Us | LN Boys PG & Hostel, Jaipur');
      expect(meta.openGraph?.url).toBe('https://lnboyspg.in/contact');
    });

    it('should generate blog index page metadata with correct title pattern', () => {
      const meta = asMeta(generatePageMeta('blog'));
      
      expect(meta.title).toBe('PG Guide & Local Tips | LN Boys PG & Hostel Blog');
      expect(meta.openGraph?.url).toBe('https://lnboyspg.in/blog');
    });

    it('should generate blog post page metadata using post metaTitle', () => {
      const post: PostForSEO = {
        slug: 'best-pg-near-jecrc',
        metaTitle: 'Best PG Near JECRC Jaipur - Complete Guide 2024',
        metaDescription: 'Discover the best paying guest options near JECRC college in Jaipur.',
      };
      
      const meta = asMeta(generatePageMeta('post', { post }));
      
      expect(meta.title).toBe('Best PG Near JECRC Jaipur - Complete Guide 2024');
      expect(meta.description).toBe('Discover the best paying guest options near JECRC college in Jaipur.');
      expect(meta.openGraph?.url).toBe('https://lnboyspg.in/blog/best-pg-near-jecrc');
    });

    it('should include all required OpenGraph tags', () => {
      const meta = asMeta(generatePageMeta('home'));
      
      expect(meta.openGraph).toBeDefined();
      expect(meta.openGraph?.title).toBeDefined();
      expect(meta.openGraph?.description).toBeDefined();
      expect(meta.openGraph?.url).toBeDefined();
      expect(meta.openGraph?.type).toBe('website');
      expect(meta.openGraph?.images).toBeDefined();
      expect(meta.openGraph?.images).toHaveLength(1);
    });

    it('should include all required Twitter Card tags', () => {
      const meta = asMeta(generatePageMeta('home'));
      
      expect(meta.twitter).toBeDefined();
      expect(meta.twitter?.card).toBe('summary_large_image');
      expect(meta.twitter?.title).toBeDefined();
      expect(meta.twitter?.description).toBeDefined();
      expect(meta.twitter?.images).toBeDefined();
    });

    it('should throw error when branch is required but not provided', () => {
      expect(() => generatePageMeta('branch')).toThrow('Branch and landmark are required for branch page metadata');
    });

    it('should throw error when landmark is required but not provided', () => {
      const branch: BranchForSEO = {
        branchId: 'test',
        name: 'Test',
        city: 'Jaipur',
        startingPrice: 8000,
      };
      
      expect(() => generatePageMeta('branch', { branch })).toThrow('Branch and landmark are required for branch page metadata');
    });

    it('should throw error when post is required but not provided', () => {
      expect(() => generatePageMeta('post')).toThrow('Post is required for post page metadata');
    });

    it('should use custom description when provided', () => {
      const meta = asMeta(generatePageMeta('home', { description: 'Custom home description' }));
      
      expect(meta.description).toBe('Custom home description');
    });

    it('should use custom image URL when provided', () => {
      const branch: BranchForSEO = {
        branchId: 'test',
        name: 'Test Branch',
        city: 'Jaipur',
        startingPrice: 8000,
        heroImageUrl: 'https://example.com/custom-hero.jpg',
      };
      
      const meta = asMeta(generatePageMeta('branch', { branch, landmark: 'Test' }));
      
      expect((meta.openGraph?.images as Array<{ url: string }>)?.[0]?.url).toBe('https://example.com/custom-hero.jpg');
    });

    it('should use default image when no custom image provided', () => {
      const meta = asMeta(generatePageMeta('home'));
      
      expect((meta.openGraph?.images as Array<{ url: string }>)?.[0]?.url).toBe('/og-default.jpg');
    });
  });

  describe('generateHeroAlt', () => {
    it('should generate hero alt text with branch name', () => {
      const alt = generateHeroAlt('LN Boys PG & Hostel - Vidhani (JECRC)');
      
      expect(alt).toBe('Hero image for LN Boys PG & Hostel - Vidhani (JECRC)');
    });

    it('should generate alt text at least 3 characters long', () => {
      const alt = generateHeroAlt('LN');
      
      expect(alt.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('generateTrustIconAlt', () => {
    it('should generate meals icon alt text', () => {
      const alt = generateTrustIconAlt('meals');
      
      expect(alt).toBe('3 meals per day included icon');
      expect(alt.length).toBeGreaterThanOrEqual(3);
    });

    it('should generate security icon alt text', () => {
      const alt = generateTrustIconAlt('security');
      
      expect(alt).toBe('24x7 CCTV security surveillance icon');
      expect(alt.length).toBeGreaterThanOrEqual(3);
    });

    it('should generate wifi icon alt text', () => {
      const alt = generateTrustIconAlt('wifi');
      
      expect(alt).toBe('High-speed Wi-Fi internet icon');
      expect(alt.length).toBeGreaterThanOrEqual(3);
    });

    it('should generate pricing icon alt text', () => {
      const alt = generateTrustIconAlt('pricing');
      
      expect(alt).toBe('Affordable starting price icon');
      expect(alt.length).toBeGreaterThanOrEqual(3);
    });
  });
});
