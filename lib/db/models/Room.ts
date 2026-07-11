import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// TypeScript interface — describes the shape of a Room document
// ---------------------------------------------------------------------------
export interface IRoom extends Document {
  branchId: string;
  occupancyType: 'Single' | 'Double' | 'Triple';
  pricePerMonth: number;
  amenities: Types.ObjectId[];
  description: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema definition
// All field-level constraints mirror the design document exactly.
// ---------------------------------------------------------------------------
const RoomSchema = new Schema<IRoom>(
  {
    branchId: {
      type: String,
      required: true,
      // References the `branchId` slug field on a Branch document
      ref: 'Branch',
    },
    occupancyType: {
      type: String,
      required: true,
      enum: ['Single', 'Double', 'Triple'],
    },
    pricePerMonth: {
      type: Number,
      required: true,
      min: 0.01,
      max: 999999.99,
    },
    amenities: {
      type: [Schema.Types.ObjectId],
      ref: 'Amenity',
      validate: [
        (a: unknown[]) => a.length <= 30,
        'max 30 amenities',
      ],
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically manages `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Model export — guards against "Cannot overwrite model" errors during
// Next.js hot reloads in development, where modules are re-evaluated but
// mongoose.models persists across reloads.
// ---------------------------------------------------------------------------
const Room: Model<IRoom> =
  (mongoose.models.Room as Model<IRoom>) ||
  mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
