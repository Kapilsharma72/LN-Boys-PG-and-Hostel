import { describe, it, expect } from 'vitest';
import { PostCreateSchema, PostUpdateSchema } from './post';

// ---------------------------------------------------------------------------
// Shared valid payload used as baseline across tests
// ---------------------------------------------------------------------------
const validPayload = {
  slug: 'my-first-post',
  title: 'My First Post',
  excerpt: 'A short excerpt.',
  content: '# Hello\n\nThis is content.',
  author: 'Admin',
  publishedAt: '2024-01-15T10:00:00.000Z',
  tags: ['hostel', 'news'],
  metaTitle: 'My First Post | LN Boys Hostel',
  metaDescription: 'A short excerpt used for SEO.',
  published: false,
};

describe('PostCreateSchema', () => {
  it('parses a fully valid payload', () => {
    const result = PostCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('coerces publishedAt string to a Date instance', () => {
    const result = PostCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publishedAt).toBeInstanceOf(Date);
    }
  });

  it('defaults published to false when omitted', () => {
    const { published, ...rest } = validPayload;
    const result = PostCreateSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.published).toBe(false);
    }
  });

  it('defaults tags to [] when omitted', () => {
    const { tags, ...rest } = validPayload;
    const result = PostCreateSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  // ---- slug validation ----
  it('rejects slug shorter than 3 chars', () => {
    const result = PostCreateSchema.safeParse({ ...validPayload, slug: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects slug longer than 100 chars', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      slug: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase letters', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      slug: 'My-Post',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with trailing hyphen', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      slug: 'my-post-',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with consecutive hyphens', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      slug: 'my--post',
    });
    expect(result.success).toBe(false);
  });

  it('accepts slug at minimum length (3 chars)', () => {
    const result = PostCreateSchema.safeParse({ ...validPayload, slug: 'abc' });
    expect(result.success).toBe(true);
  });

  // ---- title ----
  it('rejects empty title', () => {
    const result = PostCreateSchema.safeParse({ ...validPayload, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 120 chars', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      title: 'A'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  // ---- excerpt ----
  it('rejects excerpt longer than 300 chars', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      excerpt: 'E'.repeat(301),
    });
    expect(result.success).toBe(false);
  });

  // ---- content ----
  it('rejects content longer than 100000 chars', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      content: 'C'.repeat(100001),
    });
    expect(result.success).toBe(false);
  });

  // ---- author ----
  it('rejects author longer than 80 chars', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      author: 'A'.repeat(81),
    });
    expect(result.success).toBe(false);
  });

  // ---- tags ----
  it('rejects more than 10 tags', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 10 tags', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      tags: Array.from({ length: 10 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(true);
  });

  // ---- metaTitle ----
  it('rejects metaTitle longer than 70 chars', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      metaTitle: 'M'.repeat(71),
    });
    expect(result.success).toBe(false);
  });

  // ---- metaDescription ----
  it('rejects metaDescription longer than 160 chars', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      metaDescription: 'D'.repeat(161),
    });
    expect(result.success).toBe(false);
  });

  // ---- publishedAt ----
  it('rejects an invalid date string', () => {
    const result = PostCreateSchema.safeParse({
      ...validPayload,
      publishedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('PostUpdateSchema', () => {
  it('succeeds with an empty object (all fields optional)', () => {
    const result = PostUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial update with only slug', () => {
    const result = PostUpdateSchema.safeParse({ slug: 'updated-slug' });
    expect(result.success).toBe(true);
  });

  it('still validates slug regex on partial update', () => {
    const result = PostUpdateSchema.safeParse({ slug: 'Bad Slug!' });
    expect(result.success).toBe(false);
  });

  it('still validates title length on partial update', () => {
    const result = PostUpdateSchema.safeParse({ title: 'T'.repeat(121) });
    expect(result.success).toBe(false);
  });
});
