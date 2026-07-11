/**
 * SEO Utilities
 * 
 * Helper functions for generating page titles and metadata following
 * the specified SEO patterns from the design document.
 */

import { Metadata } from 'next';

/**
 * Branch interface (minimal fields needed for SEO)
 */
export interface BranchForSEO {
  branchId: string;
  name: string;
  city: string;
  metaDescription?: string | null;
  startingPrice: number;
  heroImageUrl?: string | null;
}

/**
 * Post interface (minimal fields needed for SEO)
 */
export interface PostForSEO {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  heroImageUrl?: string | null;
}

/**
 * Generate the title for a Branch Detail Page following the pattern:
 * "[Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel"
 * 
 * @param branch - Branch object with name, city
 * @param landmark - Landmark name (e.g., "JECRC")
 * @returns Formatted title string
 * 
 * **Validates: Requirements 10.1**
 */
export function generateBranchTitle(branch: BranchForSEO, landmark: string): string {
  return `${branch.name} | Best Boys PG near ${landmark}, ${branch.city} | LN Boys PG & Hostel`;
}

/**
 * Generate metadata for different page types following the design patterns.
 * 
 * Page Title Patterns:
 * - Home: "Best Boys PG & Hostel in Jaipur | LN Boys PG & Hostel"
 * - Branch Detail: "[Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel"
 * - Locations: "All PG & Hostel Locations in Jaipur | LN Boys PG & Hostel"
 * - About: "About Us | LN Boys PG & Hostel, Jaipur"
 * - Contact: "Contact Us | LN Boys PG & Hostel, Jaipur"
 * - Blog index: "PG Guide & Local Tips | LN Boys PG & Hostel Blog"
 * - Blog post: "[post.metaTitle]"
 * 
 * @param pageType - Type of page: 'home' | 'locations' | 'about' | 'contact' | 'blog' | 'branch' | 'post'
 * @param options - Additional data needed for specific page types
 * @returns Next.js Metadata object
 * 
 * **Validates: Requirements 10.1, 10.3, 10.4**
 */
export function generatePageMeta(
  pageType: 'home' | 'locations' | 'about' | 'contact' | 'blog' | 'branch' | 'post',
  options?: {
    branch?: BranchForSEO;
    landmark?: string;
    post?: PostForSEO;
    description?: string;
    imageUrl?: string;
    url?: string;
  }
): Metadata {
  const siteUrl = 'https://lnboyspg.in';
  const defaultImage = '/og-default.jpg';

  let title: string;
  let description: string;
  let url: string;
  let image: string;

  switch (pageType) {
    case 'home':
      title = 'Best Boys PG & Hostel in Jaipur | LN Boys PG & Hostel';
      description = options?.description ?? 'Premium paying guest accommodation for boys in Jaipur. Safe, comfortable, and affordable PG & hostel with modern amenities. Starting ₹8,000/month.';
      url = siteUrl;
      image = options?.imageUrl ?? defaultImage;
      break;

    case 'branch':
      if (!options?.branch || !options?.landmark) {
        throw new Error('Branch and landmark are required for branch page metadata');
      }
      title = generateBranchTitle(options.branch, options.landmark);
      description = options.branch.metaDescription ?? 
        `Affordable PG & hostel accommodation at ${options.branch.name}. Starting ₹${options.branch.startingPrice}/month.`;
      url = `${siteUrl}/branch/${options.branch.branchId}`;
      image = options.branch.heroImageUrl ?? defaultImage;
      break;

    case 'locations':
      title = 'All PG & Hostel Locations in Jaipur | LN Boys PG & Hostel';
      description = options?.description ?? 'Explore all our PG & hostel locations across Jaipur. Find the perfect accommodation near your college or workplace.';
      url = `${siteUrl}/locations`;
      image = options?.imageUrl ?? defaultImage;
      break;

    case 'about':
      title = 'About Us | LN Boys PG & Hostel, Jaipur';
      description = options?.description ?? 'Learn about LN Boys PG & Hostel — your trusted partner for safe, comfortable, and affordable student and professional accommodation in Jaipur.';
      url = `${siteUrl}/about`;
      image = options?.imageUrl ?? defaultImage;
      break;

    case 'contact':
      title = 'Contact Us | LN Boys PG & Hostel, Jaipur';
      description = options?.description ?? 'Get in touch with LN Boys PG & Hostel. Call us at +91 83858 57902 or visit our branches in Jaipur for a personal tour.';
      url = `${siteUrl}/contact`;
      image = options?.imageUrl ?? defaultImage;
      break;

    case 'blog':
      title = 'PG Guide & Local Tips | LN Boys PG & Hostel Blog';
      description = options?.description ?? 'Guides, tips, and local insights for students and professionals looking for PG accommodation in Jaipur.';
      url = `${siteUrl}/blog`;
      image = options?.imageUrl ?? defaultImage;
      break;

    case 'post':
      if (!options?.post) {
        throw new Error('Post is required for post page metadata');
      }
      title = options.post.metaTitle;
      description = options.post.metaDescription;
      url = `${siteUrl}/blog/${options.post.slug}`;
      image = options.post.heroImageUrl ?? defaultImage;
      break;

    default:
      throw new Error(`Unknown page type: ${pageType}`);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Generate alt text for hero images
 * 
 * @param branchName - Name of the branch
 * @returns Alt text string
 */
export function generateHeroAlt(branchName: string): string {
  return `Hero image for ${branchName}`;
}

/**
 * Generate alt text for trust strip icons
 * 
 * @param iconType - Type of trust icon
 * @returns Alt text string
 */
export function generateTrustIconAlt(iconType: 'meals' | 'security' | 'wifi' | 'pricing'): string {
  const altTexts = {
    meals: '3 meals per day included icon',
    security: '24x7 CCTV security surveillance icon',
    wifi: 'High-speed Wi-Fi internet icon',
    pricing: 'Affordable starting price icon',
  };
  return altTexts[iconType];
}
