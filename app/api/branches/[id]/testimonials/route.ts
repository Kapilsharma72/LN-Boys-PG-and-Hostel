import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Testimonial from '@/lib/db/models/Testimonial';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Validation schema for testimonial creation
 */
const TestimonialCreateSchema = z.object({
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
});

/**
 * GET /api/branches/[id]/testimonials
 *
 * Public route that returns only approved testimonials for a specific branch.
 *
 * Requirements: 1.5, 12.7
 *
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Testimonial[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const testimonials = await Testimonial.find({
      branchId: params.id,
      approved: true,
    }).lean();

    return NextResponse.json(
      { success: true, data: testimonials },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[GET /api/branches/${params.id}/testimonials] Error:`, error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branches/[id]/testimonials
 *
 * Admin-only route to create a new testimonial for a specific branch.
 * Requires CSRF token validation.
 * The `approved` field defaults to false on creation.
 *
 * Requirements: 1.5, 12.7
 *
 * @param params - Route params containing the branchId
 * @returns 201 with { success: true, data: Testimonial }
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
    const validation = TestimonialCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // Connect to database and create testimonial (approved defaults to false)
    await connectDB();
    const newTestimonial = await Testimonial.create({
      ...validation.data,
      branchId: params.id,
    });

    return NextResponse.json(
      { success: true, data: newTestimonial },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[POST /api/branches/${params.id}/testimonials] Error:`, error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
