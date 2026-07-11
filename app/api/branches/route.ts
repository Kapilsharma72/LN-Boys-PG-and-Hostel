import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import { BranchCreateSchema } from '@/lib/validations/branch';
import { getSession } from '@/lib/auth/session';

/**
 * GET /api/branches
 * 
 * Public route that returns all branches.
 * 
 * Requirements: 1.1, 13.1
 * 
 * @returns 200 with { success: true, data: Branch[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET() {
  try {
    await connectDB();
    const branches = await Branch.find().lean();
    
    return NextResponse.json(
      { success: true, data: branches },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error('[GET /api/branches] Error:', error);
    
    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branches
 * 
 * Admin-only route to create a new branch.
 * 
 * Requirements: 1.1, 13.1, 13.2
 * 
 * @returns 201 with { success: true, data: Branch }
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 422 with { success: false, error: "Branch ID already exists" } - duplicate branchId
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function POST(request: Request) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate with Zod schema
    const validation = BranchCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and create branch
    await connectDB();
    const newBranch = await Branch.create(validation.data);

    return NextResponse.json(
      { success: true, data: newBranch },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Log the full error server-side for debugging
    console.error('[POST /api/branches] Error:', error);

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
