import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Amenity from '@/lib/db/models/Amenity';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for amenity updates
 * Same as creation schema but with all fields optional using .partial()
 */
const AmenityUpdateSchema = z
  .object({
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
  })
  .partial();

/**
 * PATCH /api/branches/[id]/amenities/[aId]
 * 
 * Admin-only route to update a specific amenity.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.3
 * 
 * @param params - Route params containing branchId (id) and aId
 * @returns 200 with { success: true, data: Amenity } - amenity updated successfully
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Amenity not found" } - amenity doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; aId: string } }
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
    const validation = AmenityUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and update amenity
    await connectDB();
    const updatedAmenity = await Amenity.findOneAndUpdate(
      { _id: params.aId, branchId: params.id },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedAmenity) {
      return NextResponse.json(
        { success: false, error: 'Amenity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedAmenity },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(
      `[PATCH /api/branches/${params.id}/amenities/${params.aId}] Error:`,
      error
    );

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/branches/[id]/amenities/[aId]
 * 
 * Admin-only route to delete a specific amenity.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.3
 * 
 * @param params - Route params containing branchId (id) and aId
 * @returns 200 with { success: true, data: { deleted: true } } - amenity deleted successfully
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Amenity not found" } - amenity doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; aId: string } }
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

    // Connect to database and delete amenity
    await connectDB();
    const deletedAmenity = await Amenity.findOneAndDelete({
      _id: params.aId,
      branchId: params.id,
    });

    if (!deletedAmenity) {
      return NextResponse.json(
        { success: false, error: 'Amenity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(
      `[DELETE /api/branches/${params.id}/amenities/${params.aId}] Error:`,
      error
    );

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
