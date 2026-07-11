/**
 * Example usage of SEO utility functions
 * 
 * This file demonstrates how to use the SEO helpers in Next.js pages.
 * These examples align with the design patterns from design.md.
 */

import { generateBranchTitle, generatePageMeta } from './seo';

// Example 1: Home Page
// Location: app/page.tsx
export async function generateMetadataForHome() {
  return generatePageMeta('home');
}

// Example 2: Branch Detail Page
// Location: app/branch/[branchId]/page.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadataForBranch(branchData: any) {
  const branch = {
    branchId: branchData.branchId,
    name: branchData.name,
    city: branchData.city,
    metaDescription: branchData.metaDescription,
    startingPrice: branchData.startingPrice,
    heroImageUrl: branchData.heroImageUrl,
  };

  return generatePageMeta('branch', {
    branch,
    landmark: 'JECRC', // This could be extracted from branch data or config
  });
}

// Example 3: Locations Page
// Location: app/locations/page.tsx
export async function generateMetadataForLocations() {
  return generatePageMeta('locations');
}

// Example 4: About Page
// Location: app/about/page.tsx
export async function generateMetadataForAbout() {
  return generatePageMeta('about');
}

// Example 5: Contact Page
// Location: app/contact/page.tsx
export async function generateMetadataForContact() {
  return generatePageMeta('contact');
}

// Example 6: Blog Index
// Location: app/blog/page.tsx
export async function generateMetadataForBlog() {
  return generatePageMeta('blog');
}

// Example 7: Blog Post
// Location: app/blog/[slug]/page.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadataForPost(postData: any) {
  const post = {
    slug: postData.slug,
    metaTitle: postData.metaTitle,
    metaDescription: postData.metaDescription,
    heroImageUrl: postData.heroImageUrl,
  };

  return generatePageMeta('post', { post });
}

// Example 8: Direct title generation for branch page
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getBranchPageTitle(branchData: any): string {
  return generateBranchTitle(
    {
      branchId: branchData.branchId,
      name: branchData.name,
      city: branchData.city,
      startingPrice: branchData.startingPrice,
    },
    'JECRC'
  );
}

// Example 9: Custom description override
export async function generateMetadataWithCustomDescription() {
  return generatePageMeta('home', {
    description: 'Special promotional description for home page',
  });
}

// Example 10: Custom image override
export async function generateMetadataWithCustomImage() {
  return generatePageMeta('about', {
    imageUrl: 'https://res.cloudinary.com/ln-hostel/custom-about-hero.jpg',
  });
}
