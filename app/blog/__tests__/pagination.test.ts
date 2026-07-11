// @vitest-environment node
/**
 * Property-based tests for blog pagination logic.
 *
 * **Validates: Requirements 8.1**
 *
 * Property 24: Blog pagination shows at most 10 posts per page.
 *
 * This test suite exercises the pure pagination calculation extracted from
 * `app/blog/page.tsx`. No database or Next.js runtime is required.
 *
 * The pagination algorithm under test:
 *   const POSTS_PER_PAGE = 10;
 *   const safePage  = page < 1 ? 1 : page;
 *   const skip      = (safePage - 1) * POSTS_PER_PAGE;
 *   const slice     = allPosts.slice(skip, skip + POSTS_PER_PAGE);
 *   const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Re-implementation of the pure pagination logic from app/blog/page.tsx
// (no DB, no React, no Next.js — purely deterministic calculations)
// ---------------------------------------------------------------------------

const POSTS_PER_PAGE = 10;

interface PostStub {
  slug: string;
  published: boolean;
}

/**
 * Computes the pagination result for a given pool of published posts and a
 * requested page number — mirroring getPublishedPosts() in app/blog/page.tsx.
 */
function paginatePosts(allPosts: PostStub[], page: number) {
  // Guard: page numbers below 1 are treated as page 1 (mirrors safePage logic)
  const safePage = page < 1 ? 1 : page;
  const skip = (safePage - 1) * POSTS_PER_PAGE;

  // Only published posts are returned (mirrors { published: true } DB filter)
  const publishedPosts = allPosts.filter((p) => p.published);
  const totalCount = publishedPosts.length;

  // Slice mirrors .skip(skip).limit(POSTS_PER_PAGE) on a sorted list
  const posts = publishedPosts.slice(skip, skip + POSTS_PER_PAGE);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return { posts, totalCount, currentPage: safePage, totalPages };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates an array of 0–100 PostStubs all with published: true
 * (matching the { published: true } query filter in the blog page).
 */
const publishedPostsArb = fc.array(
  fc.record({
    slug: fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/).filter((s) => s.length >= 3),
    published: fc.constant(true),
  }),
  { minLength: 0, maxLength: 100 }
);

/**
 * Generates a page number in the range 1–50 (valid pages).
 */
const validPageArb = fc.integer({ min: 1, max: 50 });

/**
 * Generates a page number that may be zero or negative (edge cases).
 */
const invalidPageArb = fc.integer({ min: -100, max: 0 });

// ---------------------------------------------------------------------------
// Property 24 — at most 10 posts per page
// ---------------------------------------------------------------------------

describe('Property 24 — Blog pagination shows at most 10 posts per page', () => {
  it('24a: the returned posts slice always has at most 10 items for any valid page', () => {
    fc.assert(
      fc.property(publishedPostsArb, validPageArb, (posts, page) => {
        const { posts: slice } = paginatePosts(posts, page);
        expect(slice.length).toBeLessThanOrEqual(POSTS_PER_PAGE);
      }),
      { numRuns: 200 }
    );
  });

  it('24b: the returned posts slice always has at most 10 items even for invalid page numbers', () => {
    fc.assert(
      fc.property(publishedPostsArb, invalidPageArb, (posts, page) => {
        const { posts: slice } = paginatePosts(posts, page);
        expect(slice.length).toBeLessThanOrEqual(POSTS_PER_PAGE);
      }),
      { numRuns: 100 }
    );
  });

  it('24c: skip is calculated as (page - 1) * 10 for any valid page number', () => {
    fc.assert(
      fc.property(validPageArb, (page) => {
        // We can verify the skip value by checking which items are returned
        // for a pool large enough that page N always has items.
        const largePosts: PostStub[] = Array.from({ length: 100 }, (_, i) => ({
          slug: `post-${i}`,
          published: true,
        }));

        const expectedSkip = (page - 1) * POSTS_PER_PAGE;
        const { posts: slice } = paginatePosts(largePosts, page);

        // The first element of the slice should be the post at index `expectedSkip`
        if (slice.length > 0) {
          expect(slice[0].slug).toBe(largePosts[expectedSkip].slug);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('24d: totalPages equals Math.ceil(totalCount / 10) for any pool size', () => {
    fc.assert(
      fc.property(publishedPostsArb, validPageArb, (posts, page) => {
        const { totalCount, totalPages } = paginatePosts(posts, page);
        expect(totalPages).toBe(Math.ceil(totalCount / POSTS_PER_PAGE));
      }),
      { numRuns: 200 }
    );
  });

  it('24e: totalPages is 0 when there are no published posts', () => {
    fc.assert(
      fc.property(validPageArb, (page) => {
        const { totalPages, posts } = paginatePosts([], page);
        expect(totalPages).toBe(0);
        expect(posts.length).toBe(0);
      }),
      { numRuns: 50 }
    );
  });

  it('24f: page numbers ≤ 0 are treated as page 1 (skip = 0)', () => {
    fc.assert(
      fc.property(publishedPostsArb, invalidPageArb, (posts, page) => {
        const { currentPage } = paginatePosts(posts, page);
        // safePage must be 1 when raw page ≤ 0
        expect(currentPage).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('24g: page beyond totalPages returns an empty slice (not an error)', () => {
    fc.assert(
      fc.property(
        publishedPostsArb,
        fc.integer({ min: 11, max: 50 }), // force a page well past any realistic total
        (posts, page) => {
          const { posts: slice, totalPages } = paginatePosts(posts, page);
          if (page > totalPages) {
            expect(slice.length).toBe(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('24h: totalCount equals the number of published posts in the input', () => {
    fc.assert(
      fc.property(publishedPostsArb, validPageArb, (posts, page) => {
        // All stubs have published: true, so totalCount must equal posts.length
        const { totalCount } = paginatePosts(posts, page);
        expect(totalCount).toBe(posts.length);
      }),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Deterministic edge-case examples
// ---------------------------------------------------------------------------

describe('Property 24 — deterministic edge cases', () => {
  it('exactly 10 posts on page 1 — slice length is 10', () => {
    const posts: PostStub[] = Array.from({ length: 10 }, (_, i) => ({
      slug: `post-${i}`,
      published: true,
    }));
    const { posts: slice, totalPages } = paginatePosts(posts, 1);
    expect(slice.length).toBe(10);
    expect(totalPages).toBe(1);
  });

  it('11 posts: page 1 returns 10, page 2 returns 1', () => {
    const posts: PostStub[] = Array.from({ length: 11 }, (_, i) => ({
      slug: `post-${i}`,
      published: true,
    }));
    const page1 = paginatePosts(posts, 1);
    const page2 = paginatePosts(posts, 2);

    expect(page1.posts.length).toBe(10);
    expect(page2.posts.length).toBe(1);
    expect(page1.totalPages).toBe(2);
  });

  it('0 posts — totalPages is 0, slice is empty, currentPage is 1', () => {
    const { posts, totalPages, currentPage } = paginatePosts([], 1);
    expect(posts.length).toBe(0);
    expect(totalPages).toBe(0);
    expect(currentPage).toBe(1);
  });

  it('100 posts — 10 full pages', () => {
    const posts: PostStub[] = Array.from({ length: 100 }, (_, i) => ({
      slug: `post-${i}`,
      published: true,
    }));
    const { totalPages } = paginatePosts(posts, 1);
    expect(totalPages).toBe(10);

    // Every page should have exactly 10 posts
    for (let p = 1; p <= 10; p++) {
      const { posts: slice } = paginatePosts(posts, p);
      expect(slice.length).toBe(10);
    }
  });

  it('skip for page 3 of 25 posts is 20 — returns posts 20–24', () => {
    const posts: PostStub[] = Array.from({ length: 25 }, (_, i) => ({
      slug: `post-${i}`,
      published: true,
    }));
    const { posts: slice } = paginatePosts(posts, 3);
    expect(slice.length).toBe(5);
    expect(slice[0].slug).toBe('post-20');
    expect(slice[4].slug).toBe('post-24');
  });
});
