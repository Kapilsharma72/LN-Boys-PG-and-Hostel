import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Policy from '@/lib/db/models/Policy';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for policy updates
 * Same as creation schema but with all fields optional using .partial()
 */
const PolicyUpdateSchema = z
  .object({
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
  })
  .partial();

/**
 * PATCH /api/branches/[id]/policies/[pId]
 *
 * Admin-only route to update a specific policy.
 * Requires CSRF token validation.
 *
 * Requirements: 1.6
 *
 * @param params - Route params containing branchId (id) and pId
 * @returns 200 with { success: true, data: Policy } - policy updated successfully
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Policy not found" } - policy doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; pId: string } }
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
    const validation = PolicyUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and update policy
    await connectDB();
    const updatedPolicy = await Policy.findOneAndUpdate(
      { _id: params.pId, branchId: params.id },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedPolicy) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedPolicy },
      { status: 200 }
    );
  } catch (error) {
    // Log the full error server-side for debugging
    console.error(
      `[PATCH /api/branches/${params.id}/policies/${params.pId}] Error:`,
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
 * DELETE /api/branches/[id]/policies/[pId]
 *
 * Admin-only route to delete a specific policy.
 * Requires CSRF token validation.
 *
 * Requirements: 1.6
 *
 * @param params - Route params containing branchId (id) and pId
 * @returns 200 with { success: true, data: { deleted: true } } - policy deleted successfully
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Policy not found" } - policy doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; pId: string } }
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

    // Connect to database and delete policy
    await connectDB();
    const deletedPolicy = await Policy.findOneAndDelete({
      _id: params.pId,
      branchId: params.id,
    });

    if (!deletedPolicy) {
      return NextResponse.json(
        { success: false, error: 'Policy not found' },
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
      `[DELETE /api/branches/${params.id}/policies/${params.pId}] Error:`,
      error
    );

    // Return generic error message to client
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
