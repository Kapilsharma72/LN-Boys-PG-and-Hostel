import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import FoodMenu from '@/lib/db/models/FoodMenu';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for food menu creation/upsert
 */
const FoodMenuCreateSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], {
    message: "day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday",
  }),
  meal: z.enum(['breakfast', 'lunch', 'dinner'], {
    message: "meal must be 'breakfast', 'lunch', or 'dinner'",
  }),
  items: z
    .array(
      z
        .string()
        .min(1, 'each item must be at least 1 character')
        .max(100, 'each item must be at most 100 characters')
    )
    .min(1, 'items must contain at least 1 entry')
    .max(20, 'items must contain at most 20 entries'),
});

/**
 * GET /api/branches/[id]/food-menu
 * 
 * Public route that returns all food menu items for a specific branch.
 * 
 * Requirements: 1.4, 1.11
 * 
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: FoodMenu[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const foodMenuItems = await FoodMenu.find({ branchId: params.id }).lean();
    
    return NextResponse.json(
      { success: true, data: foodMenuItems },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[GET /api/branches/${params.id}/food-menu] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branches/[id]/food-menu
 * 
 * Admin-only route to upsert a food menu item for a specific branch.
 * If a menu item with the same branchId+day+meal combination exists, it will be updated.
 * Otherwise, a new menu item will be created.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.4, 1.11
 * 
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: FoodMenu } - menu item upserted successfully
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CSRF token validation
    const csrfHeader = request.headers.get('X-CSRF-Token');
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get('csrf-token')?.value;
    
    if (!validateCsrfToken(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate with Zod schema
    const validation = FoodMenuCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and upsert food menu item
    await connectDB();
    
    // Prepare the data for upsert
    const menuData = {
      branchId: params.id,
      day: validation.data.day,
      meal: validation.data.meal,
      items: validation.data.items,
    };

    // Upsert: if branchId+day+meal exists, update it; otherwise create it
    const upsertedMenu = await FoodMenu.findOneAndUpdate(
      { branchId: params.id, day: validation.data.day, meal: validation.data.meal },
      menuData,
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(
      { success: true, data: upsertedMenu },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[POST /api/branches/${params.id}/food-menu] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
