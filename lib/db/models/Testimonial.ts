import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript Interface
// Defines the shape of a Testimonial document for type safety across the app.
// ---------------------------------------------------------------------------
export interface ITestimonial extends Document {
  branchId: string;
  authorName: string;
  rating: number;
  text: string;
  date: Date;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Mongoose Schema Definition
// Implements the Testimonial schema from the design document with:
// - branchId reference to Branch
// - authorName with length constraints (1-80 chars)
// - rating with min/max bounds (1-5) and integer validation
// - text with length constraints (1-1000 chars)
// - date field for testimonial submission date
// - approved boolean flag (defaults to false)
// - automatic timestamps for audit trail
// ---------------------------------------------------------------------------
const TestimonialSchema = new Schema<ITestimonial>(
  {
    branchId: {
      type: String,
      required: true,
      ref: 'Branch',
    },
    authorName: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 80,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    text: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1000,
    },
    date: {
      type: Date,
      required: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Model Export
// Safe export pattern prevents "Cannot overwrite model" errors in Next.js
// hot-reload scenarios. Checks mongoose.models first before compiling.
// ---------------------------------------------------------------------------
const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial ||
  mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);

export default Testimonial;
