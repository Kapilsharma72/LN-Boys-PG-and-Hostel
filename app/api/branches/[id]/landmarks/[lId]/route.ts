import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Landmark from '@/lib/db/models/Landmark';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for landmark updates
 * Same as creation schema but with all fields optional using .partial()
 */
const LandmarkUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, 'name must be at least 1 character')
      .max(120, 'name must be at most 120 characters'),
    category: z.enum(['college', 'hospital', 'transport', 'other'], {
      message: "category must be 'college', 'hospital', 'transport', or 'other'",
    }),
    distanceMetres: z
      .number()
      .int('distanceMetres must be an integer')
      .min(0, 'distanceMetres must be non-negative'),
    googleMapsUrl: z
      .string()
      .min(1, 'googleMapsUrl must be at least 1 character')
      .max(500, 'googleMapsUrl must be at most 500 characters')
      .url('googleMapsUrl must be a valid URL'),
  })
  .partial();

/**
 * PATCH /api/branches/[id]/landmarks/[lId]
 *
 * Admin-only route to update a specific landmark.
 * Requires CSRF token validation.
 *
 * Requirements: 1.7
 *
 * @param params - Route params containing branchId (id) and lId
 * @returns 200 with { success: true, data: Landmark } - landmark updated successfully
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Landmark not found" } - landmark doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; lId: string } }
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
    const validation = LandmarkUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and update landmark
    await connectDB();
    const updatedLandmark = await Landmark.findOneAndUpdate(
      { _id: params.lId, branchId: params.id },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedLandmark) {
      return NextResponse.json(
        { success: false, error: 'Landmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedLandmark },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(
      `[PATCH /api/branches/${params.id}/landmarks/${params.lId}] Error:`,
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
 * DELETE /api/branches/[id]/landmarks/[lId]
 *
 * Admin-only route to delete a specific landmark.
 * Requires CSRF token validation.
 *
 * Requirements: 1.7
 *
 * @param params - Route params containing branchId (id) and lId
 * @returns 200 with { success: true, data: { deleted: true } } - landmark deleted successfully
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Landmark not found" } - landmark doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; lId: string } }
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

    // Connect to database and delete landmark
    await connectDB();
    const deletedLandmark = await Landmark.findOneAndDelete({
      _id: params.lId,
      branchId: params.id,
    });

    if (!deletedLandmark) {
      return NextResponse.json(
        { success: false, error: 'Landmark not found' },
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
      `[DELETE /api/branches/${params.id}/landmarks/${params.lId}] Error:`,
      error
    );

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
