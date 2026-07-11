import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Landmark from '@/lib/db/models/Landmark';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for landmark creation
 */
const LandmarkCreateSchema = z.object({
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
});

/**
 * GET /api/branches/[id]/landmarks
 *
 * Public route that returns all landmarks for a specific branch.
 *
 * Requirements: 1.7
 *
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Landmark[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const landmarks = await Landmark.find({ branchId: params.id }).lean();

    return NextResponse.json(
      { success: true, data: landmarks },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[GET /api/branches/${params.id}/landmarks] Error:`, error);

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branches/[id]/landmarks
 *
 * Admin-only route to create a new landmark for a specific branch.
 * Requires CSRF token validation.
 *
 * Requirements: 1.7
 *
 * @param params - Route params containing the branchId
 * @returns 201 with { success: true, data: Landmark }
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
    const validation = LandmarkCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and create landmark
    await connectDB();
    const newLandmark = await Landmark.create({
      ...validation.data,
      branchId: params.id,
    });

    return NextResponse.json(
      { success: true, data: newLandmark },
      { status: 201 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[POST /api/branches/${params.id}/landmarks] Error:`, error);

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
