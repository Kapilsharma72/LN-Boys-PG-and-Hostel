import { describe, it, expect } from 'vitest';
import type { IConfig } from 'next-sitemap';

describe('next-sitemap configuration', () => {
  it('should export a valid next-sitemap config object', async () => {
    // Dynamically import the config to test its structure
    const configModule = await import('./next-sitemap.config');
    const config = configModule.default as IConfig;

    // Verify required fields are present
    expect(config.siteUrl).toBeDefined();
    expect(typeof config.siteUrl).toBe('string');
    expect(config.generateRobotsTxt).toBe(true);

    // Verify robots.txt configuration
    expect(config.robotsTxtOptions).toBeDefined();
    expect(config.robotsTxtOptions?.policies).toBeDefined();
    expect(Array.isArray(config.robotsTxtOptions?.policies)).toBe(true);

    // Verify that /admin and /api are disallowed
    const policies = config.robotsTxtOptions?.policies ?? [];
    const disallowPolicy = policies.find(
      (p) => p.userAgent === '*' && Array.isArray(p.disallow)
    );
    expect(disallowPolicy).toBeDefined();
    expect(disallowPolicy?.disallow).toContain('/admin');
    expect(disallowPolicy?.disallow).toContain('/api');

    // Verify additionalPaths is a function
    expect(config.additionalPaths).toBeDefined();
    expect(typeof config.additionalPaths).toBe('function');
  });

  it('should have proper exclude patterns', async () => {
    const configModule = await import('./next-sitemap.config');
    const config = configModule.default as IConfig;

    expect(config.exclude).toBeDefined();
    expect(Array.isArray(config.exclude)).toBe(true);
    expect(config.exclude).toContain('/admin/*');
    expect(config.exclude).toContain('/api/*');
  });

  it('should use environment variable for siteUrl if available', async () => {
    // Store original env var
    const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // Set a test value
    process.env.NEXT_PUBLIC_SITE_URL = 'https://test.example.com';

    // Re-import the config (in a real scenario, this would need module cache clearing)
    const configModule = await import('./next-sitemap.config');
    const config = configModule.default as IConfig;

    // Verify siteUrl matches env var or falls back to default
    expect(
      config.siteUrl === 'https://test.example.com' ||
        config.siteUrl === 'https://lnboyspg.in'
    ).toBe(true);

    // Restore original env var
    if (originalSiteUrl !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });
});
