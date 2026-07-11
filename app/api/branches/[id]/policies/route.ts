import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Policy from '@/lib/db/models/Policy';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for policy creation
 */
const PolicyCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'title must be at least 1 character')
    .max(120, 'title must be at most 120 characters'),
  body: z
    .string()
    .min(1, 'body must be at least 1 character')
    .max(5000, 'body must be at most 5000 characters'),
  order: z
    .number({ message: 'order must be a number' })
    .int('order must be an integer')
    .min(0, 'order must be at least 0'),
});

/**
 * GET /api/branches/[id]/policies
 *
 * Public route that returns all policies for a specific branch,
 * sorted by the `order` field ascending.
 *
 * Requirements: 1.6
 *
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Policy[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const policies = await Policy.find({ branchId: params.id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json(
      { success: true, data: policies },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[GET /api/branches/${params.id}/policies] Error:`, error);

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branches/[id]/policies
 *
 * Admin-only route to create a new policy for a specific branch.
 * Requires CSRF token validation.
 *
 * Requirements: 1.6
 *
 * @param params - Route params containing the branchId
 * @returns 201 with { success: true, data: Policy }
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
    const validation = PolicyCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and create policy
    await connectDB();
    const newPolicy = await Policy.create({
      ...validation.data,
      branchId: params.id,
    });

    return NextResponse.json(
      { success: true, data: newPolicy },
      { status: 201 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(`[POST /api/branches/${params.id}/policies] Error:`, error);

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
