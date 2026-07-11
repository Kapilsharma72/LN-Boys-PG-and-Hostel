import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Post from '@/lib/db/models/Post';
import { PostUpdateSchema } from '@/lib/validations/post';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

/**
 * GET /api/posts/[id]
 *
 * Admin-only route that returns a single post by MongoDB _id.
 * Returns both published and unpublished posts.
 *
 * Requirements: 8.4
 *
 * @returns 200 { success: true, data: post }
 * @returns 401 { success: false, error: "Unauthorized" }
 * @returns 404 { success: false, error: "Post not found" }
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ── 1. Session check ──────────────────────────────────────────────────
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── 2. Fetch post (published or unpublished) ──────────────────────────
    await connectDB();

    const post = await Post.findById(params.id).lean();

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: post },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[GET /api/posts/${params.id}] Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/posts/[id]
 *
 * Admin-only route to update a post by MongoDB _id.
 * Requires CSRF token validation.
 * Accepts a partial PostUpdateSchema body.
 *
 * Requirements: 8.4
 *
 * @returns 200 { success: true, data: updatedPost }
 * @returns 400 { success: false, error: string } - validation errors
 * @returns 401 { success: false, error: "Unauthorized" }
 * @returns 403 { success: false, error: "Invalid CSRF token" }
 * @returns 404 { success: false, error: "Post not found" }
 * @returns 422 { success: false, error: "Slug already exists" } - duplicate slug
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ── 1. Session check ──────────────────────────────────────────────────
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── 2. CSRF validation ────────────────────────────────────────────────
    const csrfHeader = request.headers.get('X-CSRF-Token');
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get('csrf-token')?.value;

    if (!validateCsrfToken(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // ── 3. Parse & validate body ──────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = PostUpdateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    // ── 4. Update post ────────────────────────────────────────────────────
    await connectDB();

    const updatedPost = await Post.findByIdAndUpdate(
      params.id,
      { $set: validation.data },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedPost },
      { status: 200 }
    );
  } catch (error: unknown) {
    // ── 5. Duplicate slug (MongoDB E11000) ────────────────────────────────
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000 &&
      'keyPattern' in error &&
      typeof (error as { keyPattern: Record<string, unknown> }).keyPattern === 'object' &&
      'slug' in (error as { keyPattern: Record<string, unknown> }).keyPattern
    ) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 422 }
      );
    }

    console.error(`[PATCH /api/posts/${params.id}] Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]
 *
 * Admin-only route to delete a post by MongoDB _id.
 * Requires CSRF token validation.
 *
 * Requirements: 8.4
 *
 * @returns 200 { success: true, data: { deleted: true } }
 * @returns 401 { success: false, error: "Unauthorized" }
 * @returns 403 { success: false, error: "Invalid CSRF token" }
 * @returns 404 { success: false, error: "Post not found" }
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ── 1. Session check ──────────────────────────────────────────────────
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── 2. CSRF validation ────────────────────────────────────────────────
    const csrfHeader = request.headers.get('X-CSRF-Token');
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get('csrf-token')?.value;

    if (!validateCsrfToken(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // ── 3. Delete post ────────────────────────────────────────────────────
    await connectDB();

    const deletedPost = await Post.findByIdAndDelete(params.id);

    if (!deletedPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[DELETE /api/posts/${params.id}] Error:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
