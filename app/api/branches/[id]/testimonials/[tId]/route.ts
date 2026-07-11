import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Testimonial from '@/lib/db/models/Testimonial';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for testimonial updates.
 * Supports both approve/reject ({ approved: boolean }) and full field updates.
 * All fields are optional — at least one must be provided for a meaningful update.
 */
const TestimonialUpdateSchema = z
  .object({
    authorName: z
      .string()
      .min(1, 'authorName must be at least 1 character')
      .max(80, 'authorName must be at most 80 characters'),
    rating: z
      .number()
      .int('rating must be an integer')
      .min(1, 'rating must be at least 1')
      .max(5, 'rating must be at most 5'),
    text: z
      .string()
      .min(1, 'text must be at least 1 character')
      .max(1000, 'text must be at most 1000 characters'),
    date: z.coerce.date(),
    approved: z.boolean(),
  })
  .partial();

/**
 * PATCH /api/branches/[id]/testimonials/[tId]
 *
 * Admin-only route to update a specific testimonial.
 * Supports approve/reject via { approved: boolean } as well as full field updates.
 * Requires CSRF token validation.
 *
 * Requirements: 1.5, 12.7
 *
 * @param params - Route params containing branchId (id) and tId
 * @returns 200 with { success: true, data: Testimonial } - testimonial updated successfully
 * @returns 400 with { success: false, error: string } - validation errors
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Testimonial not found" } - testimonial doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; tId: string } }
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
    const validation = TestimonialUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and update testimonial
    await connectDB();
    const updatedTestimonial = await Testimonial.findOneAndUpdate(
      { _id: params.tId, branchId: params.id },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updatedTestimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedTestimonial },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[PATCH /api/branches/${params.id}/testimonials/${params.tId}] Error:`,
      error
    );

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/branches/[id]/testimonials/[tId]
 *
 * Admin-only route to delete a specific testimonial.
 * Requires CSRF token validation.
 *
 * Requirements: 1.5, 12.7
 *
 * @param params - Route params containing branchId (id) and tId
 * @returns 200 with { success: true, data: { deleted: true } } - testimonial deleted successfully
 * @returns 401 with { success: false, error: "Unauthorized" } - not authenticated
 * @returns 403 with { success: false, error: "Invalid CSRF token" } - CSRF validation failed
 * @returns 404 with { success: false, error: "Testimonial not found" } - testimonial doesn't exist
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tId: string } }
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

    // Connect to database and delete testimonial
    await connectDB();
    const deletedTestimonial = await Testimonial.findOneAndDelete({
      _id: params.tId,
      branchId: params.id,
    });

    if (!deletedTestimonial) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[DELETE /api/branches/${params.id}/testimonials/${params.tId}] Error:`,
      error
    );

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
