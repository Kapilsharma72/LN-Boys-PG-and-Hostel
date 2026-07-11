import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Amenity from '@/lib/db/models/Amenity';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for amenity creation
 */
const AmenityCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'name must be at least 1 character')
    .max(100, 'name must be at most 100 characters'),
  icon: z
    .string()
    .min(1, 'icon must be at least 1 character')
    .max(100, 'icon must be at most 100 characters'),
  category: z.enum(['basic', 'safety', 'comfort', 'food'], {
    message: "category must be 'basic', 'safety', 'comfort', or 'food'",
  }),
});

/**
 * GET /api/branches/[id]/amenities
 * 
 * Public route that returns all amenities for a specific branch.
 * 
 * Requirements: 1.3, 1.11
 * 
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Amenity[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const amenities = await Amenity.find({ branchId: params.id }).lean();
    
    return NextResponse.json(
      { success: true, data: amenities },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[GET /api/branches/${params.id}/amenities] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branches/[id]/amenities
 * 
 * Admin-only route to create a new amenity for a specific branch.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.3, 1.11
 * 
 * @param params - Route params containing the branchId
 * @returns 201 with { success: true, data: Amenity }
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
    const validation = AmenityCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and create amenity
    await connectDB();
    const newAmenity = await Amenity.create({
      ...validation.data,
      branchId: params.id,
    });

    return NextResponse.json(
      { success: true, data: newAmenity },
      { status: 201 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[POST /api/branches/${params.id}/amenities] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
