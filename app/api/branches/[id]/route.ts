import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import { BranchUpdateSchema } from '@/lib/validations/branch';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

/**
 * GET /api/branches/[id]
 * 
 * Public route that returns a single branch by branchId.
 * 
 * Requirements: 1.1, 13.2
 * 
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Branch }
 * @returns 404 with { success: false, error: "Branch not found" }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const branch = await Branch.findOne({ branchId: params.id }).lean();
    
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: branch },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[GET /api/branches/${params.id}] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/branches/[id]
 * 
 * Admin-only route to update an existing branch by branchId.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.1, 12.8, 13.2
 * 
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Branch }
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Branch not found" }
 * @returns 422 with { success: false, error: "Branch ID already exists" } - duplicate branchId
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function PATCH(
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
    const validation = BranchUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and update branch
    await connectDB();
    const updatedBranch = await Branch.findOneAndUpdate(
      { branchId: params.id },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedBranch },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Log the full error server-side for debugging
    console.error(`[PATCH /api/branches/${params.id}] Error:`, error);

    // Handle duplicate branchId error (MongoDB E11000)
    const mongoError = error as { code?: number; keyPattern?: { branchId?: unknown } };
    if (mongoError.code === 11000 && mongoError.keyPattern?.branchId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID already exists' },
        { status: 422 }
      );
    }

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/branches/[id]
 * 
 * Admin-only route to delete a branch by branchId.
 * Requires CSRF token validation.
 * 
 * Requirements: 1.1, 12.8, 13.2
 * 
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: { deleted: true } }
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Branch not found" }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
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

    // Connect to database and delete branch
    await connectDB();
    const deletedBranch = await Branch.findOneAndDelete({ branchId: params.id });

    if (!deletedBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[DELETE /api/branches/${params.id}] Error:`, error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
