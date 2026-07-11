import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript Interface
// Defines the shape of a Post document for type safety across the app.
// ---------------------------------------------------------------------------
export interface IPost extends Document {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Mongoose Schema Definition
// Implements the Post schema from the design document with:
// - slug: URL-safe unique identifier (lowercase alphanumeric + hyphens)
// - title, excerpt, content, author: text fields with length constraints
// - publishedAt: explicit publication date
// - tags: optional array capped at 10 items
// - metaTitle, metaDescription: SEO fields with standard length limits
// - published: boolean flag (defaults to false for draft state)
// - automatic timestamps for audit trail
// ---------------------------------------------------------------------------
const PostSchema = new Schema<IPost>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 100,
      // Enforces URL-safe slugs: lowercase alphanumeric words joined by hyphens
      match: /^[a-z0-9]+(-[a-z0-9]+)*$/,
    },
    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 120,
    },
    excerpt: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100000,
    },
    author: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 80,
    },
    publishedAt: {
      type: Date,
      required: true,
    },
    tags: {
      type: [String],
      validate: [(a: string[]) => a.length <= 10, 'max 10 tags'],
    },
    metaTitle: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 70,
    },
    metaDescription: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 160,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
// unique: true on the field already creates this index automatically.
// Explicit schema.index() call removed to avoid duplicate index warning.

// ---------------------------------------------------------------------------
// Model Export
// Safe export pattern prevents "Cannot overwrite model" errors in Next.js
// hot-reload scenarios. Checks mongoose.models first before compiling.
// ---------------------------------------------------------------------------
const Post: Model<IPost> =
  (mongoose.models.Post as Model<IPost>) ||
  mongoose.model<IPost>('Post', PostSchema);

export default Post;
