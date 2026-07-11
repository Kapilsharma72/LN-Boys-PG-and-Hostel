import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript interface — describes the shape of a Policy document
// ---------------------------------------------------------------------------
export interface IPolicy extends Document {
  branchId: string;
  title: string;
  body: string;
  order: number;
}

// ---------------------------------------------------------------------------
// Schema definition
// All field-level constraints mirror the design document exactly.
// ---------------------------------------------------------------------------
const PolicySchema = new Schema<IPolicy>({
  branchId: {
    type: String,
    required: true,
    // References the `branchId` slug field on a Branch document
    ref: 'Branch',
  },
  title: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 120,
  },
  body: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 5000,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
});

// ---------------------------------------------------------------------------
// Compound index on (branchId, order) — supports efficient per-branch
// ordered queries and enforces unique ordering within a branch.
// ---------------------------------------------------------------------------
PolicySchema.index({ branchId: 1, order: 1 });

// ---------------------------------------------------------------------------
// Model export — guards against "Cannot overwrite model" errors during
// Next.js hot reloads in development, where modules are re-evaluated but
// mongoose.models persists across reloads.
// ---------------------------------------------------------------------------
const Policy: Model<IPolicy> =
  (mongoose.models.Policy as Model<IPolicy>) ||
  mongoose.model<IPolicy>('Policy', PolicySchema);

export default Policy;
