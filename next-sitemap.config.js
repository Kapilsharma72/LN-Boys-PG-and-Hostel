/** @type {import('next-sitemap').IConfig} */

// Dynamic route discovery is handled by app/sitemap.ts (Next.js native sitemap API).
// This config handles robots.txt generation and base sitemap settings.
// The additionalPaths function gracefully handles missing env vars at build time.

const config = {
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

  // Exclude admin and API paths from sitemap entries
  exclude: ['/admin/*', '/api/*'],

  // Default values applied to every auto-discovered static page
  changefreq: 'weekly',
  priority: 0.7,

  // Dynamic routes (branch pages, blog posts) are handled via app/sitemap.ts.
  // This function returns an empty array since DB is unavailable at CI/build time
  // without real env vars; in production, app/sitemap.ts covers dynamic routes.
  additionalPaths: async () => [],
};

module.exports = config;
