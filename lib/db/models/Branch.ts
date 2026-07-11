import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript interface — describes the shape of a Branch document
// ---------------------------------------------------------------------------
export interface IBranch extends Document {
  branchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  whatsapp: string;
  startingPrice: number;
  rating: number;
  status: 'active' | 'coming-soon';
  occupancyTypes: string[];
  latitude: number | null;
  longitude: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema definition
// All field-level constraints mirror the design document exactly.
// ---------------------------------------------------------------------------
const BranchSchema = new Schema<IBranch>(
  {
    branchId: {
      type: String,
      required: true,
      unique: true,
      // Must be lowercase alphanumeric with hyphens only (URL-safe slug)
      match: /^[a-z0-9]+(-[a-z0-9]+)*$/,
      minlength: 3,
      maxlength: 80,
    },
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 120,
    },
    address: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 300,
    },
    city: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 60,
    },
    state: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 60,
    },
    pincode: {
      type: String,
      required: true,
      // Exactly 6 digits
      match: /^\d{6}$/,
    },
    phone: {
      type: [String],
      required: true,
      validate: [
        (a: string[]) => a.length >= 1 && a.length <= 5,
        'phone array must have 1–5 entries',
      ],
    },
    whatsapp: {
      type: String,
      required: true,
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0.01,
      max: 999999.99,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0.0,
      max: 5.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'coming-soon'],
    },
    occupancyTypes: {
      type: [String],
      validate: [
        (a: string[]) => a.length >= 1 && a.length <= 10,
        '1–10 entries required',
      ],
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    metaTitle: {
      type: String,
      default: null,
      maxlength: 70,
    },
    metaDescription: {
      type: String,
      default: null,
      maxlength: 160,
    },
  },
  {
    // Automatically manages `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

// Indexes
// unique: true on the field already creates this index automatically.
// Explicit schema.index() call removed to avoid duplicate index warning.

// ---------------------------------------------------------------------------
// Model export — guards against "Cannot overwrite model" errors during
// Next.js hot reloads in development, where modules are re-evaluated but
// mongoose.models persists across reloads.
// ---------------------------------------------------------------------------
const Branch: Model<IBranch> =
  (mongoose.models.Branch as Model<IBranch>) ||
  mongoose.model<IBranch>('Branch', BranchSchema);

export default Branch;
