import { z } from 'zod';

// ---------------------------------------------------------------------------
// PostCreateSchema
// Full validation schema for creating a new blog post.
// Field constraints mirror the Mongoose PostSchema and design document spec:
//   - slug:            URL-safe identifier, 3–100 chars, lowercase alphanumeric + hyphens
//   - title:           1–120 chars
//   - excerpt:         1–300 chars
//   - content:         Markdown string, 1–100 000 chars
//   - author:          1–80 chars
//   - publishedAt:     ISO 8601 coerced to Date
//   - tags:            0–10 string entries
//   - metaTitle:       1–70 chars (SEO)
//   - metaDescription: 1–160 chars (SEO)
//   - published:       boolean, defaults to false (draft state)
// ---------------------------------------------------------------------------
export const PostCreateSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug must be at most 100 characters')
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric words separated by hyphens'
    ),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),

  excerpt: z
    .string()
    .min(1, 'Excerpt is required')
    .max(300, 'Excerpt must be at most 300 characters'),

  content: z
    .string()
    .min(1, 'Content is required')
    .max(100000, 'Content must be at most 100 000 characters'),

  author: z
    .string()
    .min(1, 'Author is required')
    .max(80, 'Author must be at most 80 characters'),

  publishedAt: z.coerce.date({
    error: 'publishedAt must be a valid ISO 8601 date',
  }),

  tags: z
    .array(z.string())
    .max(10, 'A post may have at most 10 tags')
    .default([]),

  metaTitle: z
    .string()
    .min(1, 'Meta title is required')
    .max(70, 'Meta title must be at most 70 characters'),

  metaDescription: z
    .string()
    .min(1, 'Meta description is required')
    .max(160, 'Meta description must be at most 160 characters'),

  published: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// PostUpdateSchema
// Partial version of PostCreateSchema for PATCH operations.
// Every field becomes optional so callers may supply only the fields they
// want to update.
// ---------------------------------------------------------------------------
export const PostUpdateSchema = PostCreateSchema.partial();

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------
export type PostCreateInput = z.infer<typeof PostCreateSchema>;
export type PostUpdateInput = z.infer<typeof PostUpdateSchema>;
