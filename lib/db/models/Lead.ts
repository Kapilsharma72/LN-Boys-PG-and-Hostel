import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript interface — describes the shape of a Lead document
// ---------------------------------------------------------------------------
export interface ILead extends Document {
  name: string;
  mobile: string;
  preferredDate: Date | null;
  whatsappOptIn: boolean;
  intent: 'visit' | 'reserve';
  branchId: string;
  source: 'enquiry-form' | 'contact-form';
  status: 'new' | 'contacted' | 'visited' | 'converted' | 'closed';
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Schema definition
// All field-level constraints mirror the design document exactly.
// ---------------------------------------------------------------------------
const LeadSchema = new Schema<ILead>({
  name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 100,
  },
  mobile: {
    type: String,
    required: true,
    // Indian mobile numbers: starts with 6–9, followed by exactly 9 digits
    match: /^[6-9]\d{9}$/,
  },
  preferredDate: {
    type: Date,
    default: null,
  },
  whatsappOptIn: {
    type: Boolean,
    default: false,
  },
  intent: {
    type: String,
    required: true,
    enum: ['visit', 'reserve'],
  },
  branchId: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['enquiry-form', 'contact-form'],
  },
  status: {
    type: String,
    default: 'new',
    enum: ['new', 'contacted', 'visited', 'converted', 'closed'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ---------------------------------------------------------------------------
// Indexes
// Compound index supports queries that filter by mobile + branch and sort by
// creation time (e.g. duplicate-lead detection and CRM list views).
// ---------------------------------------------------------------------------
LeadSchema.index({ mobile: 1, branchId: 1, createdAt: -1 });

// ---------------------------------------------------------------------------
// Model export — guards against "Cannot overwrite model" errors during
// Next.js hot reloads in development, where modules are re-evaluated but
// mongoose.models persists across reloads.
// ---------------------------------------------------------------------------
const Lead: Model<ILead> =
  (mongoose.models.Lead as Model<ILead>) ||
  mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
