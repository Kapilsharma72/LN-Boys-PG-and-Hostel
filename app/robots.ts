import type { MetadataRoute } from 'next';

/**
 * Next.js 14 App Router robots.txt generation.
 *
 * Allows all public pages and disallows crawling of /admin and /api routes.
 * Requirement 10.6 — robots.txt must permit public pages and block /admin + /api.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://lnboyshostel.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
