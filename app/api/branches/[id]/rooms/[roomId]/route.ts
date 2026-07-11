import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Room from '@/lib/db/models/Room';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for room updates
 * Same as creation schema but with all fields optional using .partial()
 */
const RoomUpdateSchema = z
  .object({
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
  })
  .partial();

/**
 * PATCH /api/branches/[id]/rooms/[roomId]
 * 
 * Admin-only route to update a specific room.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.2
 * 
 * @param params - Route params containing branchId (id) and roomId
 * @returns 200 with { success: true, data: Room } - room updated successfully
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Room not found" } - room doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; roomId: string } }
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
    const validation = RoomUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and update room
    await connectDB();
    const updatedRoom = await Room.findOneAndUpdate(
      { _id: params.roomId, branchId: params.id },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedRoom },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(
      `[PATCH /api/branches/${params.id}/rooms/${params.roomId}] Error:`,
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
 * DELETE /api/branches/[id]/rooms/[roomId]
 * 
 * Admin-only route to delete a specific room.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.2
 * 
 * @param params - Route params containing branchId (id) and roomId
 * @returns 200 with { success: true, data: { deleted: true } } - room deleted successfully
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Room not found" } - room doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; roomId: string } }
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

    // Connect to database and delete room
    await connectDB();
    const deletedRoom = await Room.findOneAndDelete({
      _id: params.roomId,
      branchId: params.id,
    });

    if (!deletedRoom) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
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
      `[DELETE /api/branches/${params.id}/rooms/${params.roomId}] Error:`,
      error
    );

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
