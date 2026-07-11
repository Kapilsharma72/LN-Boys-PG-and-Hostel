import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript interface — describes the shape of a Landmark document
// ---------------------------------------------------------------------------
export interface ILandmark extends Document {
  branchId: string;
  name: string;
  category: 'college' | 'hospital' | 'transport' | 'other';
  distanceMetres: number;
  googleMapsUrl: string;
}

// ---------------------------------------------------------------------------
// Schema definition
// All field-level constraints mirror the design document exactly.
// ---------------------------------------------------------------------------
const LandmarkSchema = new Schema<ILandmark>({
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
    maxlength: 120,
  },
  category: {
    type: String,
    required: true,
    enum: ['college', 'hospital', 'transport', 'other'],
  },
  distanceMetres: {
    type: Number,
    required: true,
    min: 0,
  },
  googleMapsUrl: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 500,
  },
});

// ---------------------------------------------------------------------------
// Model export — guards against "Cannot overwrite model" errors during
// Next.js hot reloads in development, where modules are re-evaluated but
// mongoose.models persists across reloads.
// ---------------------------------------------------------------------------
const Landmark: Model<ILandmark> =
  (mongoose.models.Landmark as Model<ILandmark>) ||
  mongoose.model<ILandmark>('Landmark', LandmarkSchema);

export default Landmark;
