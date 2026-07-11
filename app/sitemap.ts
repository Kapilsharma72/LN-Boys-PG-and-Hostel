import type { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Post from '@/lib/db/models/Post';

/**
 * Dynamic sitemap supplement using the Next.js 14 App Router native sitemap
 * API (`app/sitemap.ts`).
 *
 * This file acts as a fallback for the primary `next-sitemap` post-build
 * generation (configured in `next-sitemap.config.ts`). If `next-sitemap`
 * fails or is unavailable (e.g., during `next dev`), Next.js will serve this
 * handler at `/sitemap.xml` instead.
 *
 * Requirement 10.5 — sitemap.xml must list:
 *   • All static public pages
 *   • All Branch Detail pages where status = "active"
 *   • All published blog posts (published = true)
 *   Each entry must include lastmod and changefreq values.
 */

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://lnboyspg.in';

// ---------------------------------------------------------------------------
// Static public pages
// ---------------------------------------------------------------------------
const staticPages: MetadataRoute.Sitemap = [
  {
    url: `${siteUrl}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${siteUrl}/locations`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${siteUrl}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${siteUrl}/contact`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    url: `${siteUrl}/policies`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${siteUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  },
];

// ---------------------------------------------------------------------------
// Dynamic sitemap generation
// ---------------------------------------------------------------------------
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Fetch active branches and published posts in parallel.
  // Both fetches are wrapped in try/catch so a DB outage degrades gracefully —
  // the sitemap still includes static pages rather than returning a 500.
  let branchEntries: MetadataRoute.Sitemap = [];
  let postEntries: MetadataRoute.Sitemap = [];

  try {
    await connectDB();

    const [branches, posts] = await Promise.all([
      Branch.find(
        { status: 'active' },
        { branchId: 1, updatedAt: 1, _id: 0 }
      ).lean<Array<{ branchId: string; updatedAt?: Date }>>(),

      Post.find(
        { published: true },
        { slug: 1, updatedAt: 1, _id: 0 }
      ).lean<Array<{ slug: string; updatedAt?: Date }>>(),
    ]);

    branchEntries = branches.map((b) => ({
      url: `${siteUrl}/branch/${b.branchId}`,
      lastModified: b.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));

    postEntries = posts.map((p) => ({
      url: `${siteUrl}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (err) {
    // Log server-side but do not surface internal details in the response.
    console.error('[sitemap] Failed to fetch dynamic routes from DB:', err);
  }

  return [...staticPages, ...branchEntries, ...postEntries];
}
