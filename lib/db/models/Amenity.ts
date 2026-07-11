import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript interface — describes the shape of an Amenity document
// ---------------------------------------------------------------------------
export interface IAmenity extends Document {
  branchId: string;
  name: string;
  icon: string;
  category: 'basic' | 'safety' | 'comfort' | 'food';
}

// ---------------------------------------------------------------------------
// Schema definition
// All field-level constraints mirror the design document exactly.
// ---------------------------------------------------------------------------
const AmenitySchema = new Schema<IAmenity>({
  branchId: {
    type: String,
    required: true,
    // References the `branchId` slug field on a Branch document
    ref: 'Branch',
  },
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
  },
  icon: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
  },
  category: {
    type: String,
    required: true,
    enum: ['basic', 'safety', 'comfort', 'food'],
  },
});

// ---------------------------------------------------------------------------
// Model export — guards against "Cannot overwrite model" errors during
// Next.js hot reloads in development, where modules are re-evaluated but
// mongoose.models persists across reloads.
// ---------------------------------------------------------------------------
const Amenity: Model<IAmenity> =
  (mongoose.models.Amenity as Model<IAmenity>) ||
  mongoose.model<IAmenity>('Amenity', AmenitySchema);

export default Amenity;
