import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import FoodMenu from '@/lib/db/models/FoodMenu';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

/**
 * DELETE /api/branches/[id]/food-menu/[fId]
 * 
 * Admin-only route to delete a specific food menu item.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.4, 1.11
 * 
 * @param params - Route params containing branchId (id) and fId
 * @returns 200 with { success: true, data: { deleted: true } } - menu item deleted successfully
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Food menu item not found" } - menu item doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fId: string } }
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

    // Connect to database and delete food menu item
    await connectDB();
    const deletedMenuItem = await FoodMenu.findOneAndDelete({
      _id: params.fId,
      branchId: params.id,
    });

    if (!deletedMenuItem) {
      return NextResponse.json(
        { success: false, error: 'Food menu item not found' },
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
      `[DELETE /api/branches/${params.id}/food-menu/${params.fId}] Error:`,
      error
    );

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
