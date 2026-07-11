import type { IConfig } from 'next-sitemap';
import { connectDB } from './lib/db/mongoose';
import Branch from './lib/db/models/Branch';
import Post from './lib/db/models/Post';

// ---------------------------------------------------------------------------
// Helper: fetch all active branches from MongoDB
// ---------------------------------------------------------------------------
async function getActiveBranches(): Promise<
  Array<{ branchId: string; updatedAt: Date }>
> {
  await connectDB();
  const branches = await Branch.find(
    { status: 'active' },
    { branchId: 1, updatedAt: 1, _id: 0 }
  ).lean();
  return branches as Array<{ branchId: string; updatedAt: Date }>;
}

// ---------------------------------------------------------------------------
// Helper: fetch all published posts from MongoDB
// ---------------------------------------------------------------------------
async function getPublishedPosts(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  await connectDB();
  const posts = await Post.find(
    { published: true },
    { slug: 1, updatedAt: 1, _id: 0 }
  ).lean();
  return posts as Array<{ slug: string; updatedAt: Date }>;
}

// ---------------------------------------------------------------------------
// next-sitemap configuration
//
// • siteUrl     — base URL of the site; falls back to NEXT_PUBLIC_SITE_URL env
//                 var so staging / preview URLs are handled automatically.
// • generateRobotsTxt — emits robots.txt alongside sitemap.xml at build time.
// • robotsTxtOptions  — permits all public pages; disallows /admin and /api.
// • additionalPaths   — injects dynamic routes (branch pages, blog posts) that
//                        the static file-system crawl would miss.
// ---------------------------------------------------------------------------
const config: IConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      // Allow all crawlers to index every public page
      { userAgent: '*', allow: '/' },
      // Keep admin panel and API routes out of search indexes
      { userAgent: '*', disallow: ['/admin', '/api'] },
    ],
  },

  // Exclude admin and API paths from sitemap entries just in case the
  // file-system crawler picks them up during the build
  exclude: ['/admin/*', '/api/*'],

  // Default values applied to every auto-discovered static page
  changefreq: 'weekly',
  priority: 0.7,

  additionalPaths: async () => {
    // Connect to MongoDB and fetch dynamic content
    const [branches, posts] = await Promise.all([
      getActiveBranches(),
      getPublishedPosts(),
    ]);

    const now = new Date().toISOString();

    return [
      // Branch detail pages — these are SSR/ISR routes not discovered by the
      // static crawler, so we add them explicitly with high priority.
      ...branches.map((b) => ({
        loc: `/branch/${b.branchId}`,
        changefreq: 'weekly' as const,
        priority: 0.9,
        lastmod: b.updatedAt ? b.updatedAt.toISOString() : now,
      })),

      // Blog / local-guide posts — content-rich pages, monthly reindex is fine.
      ...posts.map((p) => ({
        loc: `/blog/${p.slug}`,
        changefreq: 'monthly' as const,
        priority: 0.7,
        lastmod: p.updatedAt ? p.updatedAt.toISOString() : now,
      })),
    ];
  },
};

export default config;
