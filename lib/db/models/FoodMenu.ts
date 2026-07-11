import mongoose, { Document, Model, Schema } from 'mongoose';

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/**
 * IFoodMenu
 *
 * TypeScript interface representing a food menu document.
 * Each document describes the menu items for a specific branch, day, and meal.
 */
export interface IFoodMenu extends Document {
  branchId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  meal: 'breakfast' | 'lunch' | 'dinner';
  items: string[];
}

// ---------------------------------------------------------------------------
// Mongoose schema definition
// ---------------------------------------------------------------------------

const FoodMenuSchema = new Schema<IFoodMenu>(
  {
    branchId: {
      type: String,
      required: true,
      ref: 'Branch',
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    meal: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner'],
    },
    items: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length >= 1 && arr.length <= 20,
        message: '1–20 items required',
      },
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

/**
 * Compound unique index on { branchId, day, meal }
 *
 * Ensures one menu entry per (branch, day, meal) tuple.
 * This prevents duplicate menu items for the same meal on the same day
 * for a specific branch.
 */
FoodMenuSchema.index({ branchId: 1, day: 1, meal: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Model export with Next.js hot-reload safety
// ---------------------------------------------------------------------------

/**
 * FoodMenu model
 *
 * On first import, this creates the Mongoose model.
 * On subsequent hot reloads (Next.js dev mode), it reuses the existing model
 * from mongoose.models to avoid "Cannot overwrite model" errors.
 */
const FoodMenu: Model<IFoodMenu> =
  (mongoose.models.FoodMenu as Model<IFoodMenu>) ||
  mongoose.model<IFoodMenu>('FoodMenu', FoodMenuSchema);

export default FoodMenu;
