import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Room from '@/lib/db/models/Room';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for room creation
 */
const RoomCreateSchema = z.object({
  occupancyType: z.enum(['Single', 'Double', 'Triple'], {
    error: "occupancyType must be 'Single', 'Double', or 'Triple'",
  }),
  pricePerMonth: z
    .number()
    .min(0.01, 'pricePerMonth must be at least 0.01')
    .max(999999.99, 'pricePerMonth must be at most 999999.99'),
  amenities: z
    .array(z.string())
    .max(30, 'Maximum 30 amenities allowed')
    .optional(),
  description: z
    .string()
    .max(500, 'description must be at most 500 characters')
    .optional(),
  available: z.boolean().optional(),
});

/**
 * GET /api/branches/[id]/rooms
 * 
 * Public route that returns all rooms for a specific branch.
 * 
 * Requirements: 1.2, 1.11
 * 
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Room[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const rooms = await Room.find({ branchId: params.id }).lean();
    
    return NextResponse.json(
      { success: true, data: rooms },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[GET /api/branches/${params.id}/rooms] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branches/[id]/rooms
 * 
 * Admin-only route to create a new room for a specific branch.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.2, 1.11
 * 
 * @param params - Route params containing the branchId
 * @returns 201 with { success: true, data: Room }
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
    const validation = RoomCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and create room
    await connectDB();
    const newRoom = await Room.create({
      ...validation.data,
      branchId: params.id,
    });

    return NextResponse.json(
      { success: true, data: newRoom },
      { status: 201 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[POST /api/branches/${params.id}/rooms] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
