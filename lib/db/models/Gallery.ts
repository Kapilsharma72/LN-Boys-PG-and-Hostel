import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript Interface
// Describes the shape of a Gallery document for type safety across the app.
// ---------------------------------------------------------------------------
export interface IGallery extends Document {
  branchId: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  category: 'room' | 'common-area' | 'food' | 'exterior' | 'event';
  altText: string;
  uploadedAt: Date;
}

// ---------------------------------------------------------------------------
// Mongoose Schema Definition
// Implements the Gallery schema from the design document with:
// - branchId reference to Branch
// - url for the Cloudinary asset URL
// - publicId for the Cloudinary public identifier (used for deletion/transforms)
// - resourceType restricted to 'image' or 'video'
// - category for grouping gallery items by content type
// - altText with length constraints (1-200 chars) for accessibility
// - uploadedAt timestamp defaulting to now
// ---------------------------------------------------------------------------
const GallerySchema = new Schema<IGallery>({
  branchId: {
    type: String,
    required: true,
    ref: 'Branch',
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['image', 'video'],
  },
  category: {
    type: String,
    required: true,
    enum: ['room', 'common-area', 'food', 'exterior', 'event'],
  },
  altText: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 200,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// ---------------------------------------------------------------------------
// Compound Index
// Optimises queries that filter by both branchId and category, which is the
// primary access pattern for the gallery page (e.g. "show all food photos
// for branch X"). Satisfies Requirements 11.2.
// ---------------------------------------------------------------------------
GallerySchema.index({ branchId: 1, category: 1 });

// ---------------------------------------------------------------------------
// Model Export
// Safe export pattern prevents "Cannot overwrite model" errors in Next.js
// hot-reload scenarios. Checks mongoose.models first before compiling.
// ---------------------------------------------------------------------------
const Gallery: Model<IGallery> =
  (mongoose.models.Gallery as Model<IGallery>) ||
  mongoose.model<IGallery>('Gallery', GallerySchema);

export default Gallery;
