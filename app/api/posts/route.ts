import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Post from '@/lib/db/models/Post';
import { PostCreateSchema } from '@/lib/validations/post';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

/**
 * GET /api/posts
 *
 * Public, paginated list of published posts sorted by publishedAt descending.
 *
 * Requirements: 8.1
 *
 * Query params:
 *   - page  (default: 1)
 *   - limit (default: 10)
 *
 * @returns 200 { success: true, data: { posts, totalCount, page, limit } }
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') ?? '10', 10);

    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : rawLimit;
    const skip = (page - 1) * limit;

    await connectDB();

    const [posts, totalCount] = await Promise.all([
      Post.find({ published: true })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ published: true }),
    ]);

    return NextResponse.json(
      { success: true, data: { posts, totalCount, page, limit } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/posts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts
 *
 * Admin-only endpoint to create a new blog post.
 * Steps:
 *   1. Session check  (no adminId → 401)
 *   2. CSRF validation (mismatch → 403)
 *   3. Zod validation  (invalid body → 400)
 *   4. Persist post    (201)
 *   5. Duplicate slug  (E11000 on slug → 422)
 *
 * Requirements: 8.3
 *
 * @returns 201 { success: true, data: post }
 * @returns 400 { success: false, error: string }
 * @returns 401 { success: false, error: "Unauthorized" }
 * @returns 403 { success: false, error: "Invalid CSRF token" }
 * @returns 422 { success: false, error: "Slug already exists" }
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function POST(request: NextRequest) {
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
    const csrfHeader = request.headers.get('x-csrf-token');
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

    const validation = PostCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    const validData = validation.data;

    // ── 4. Persist post ───────────────────────────────────────────────────
    await connectDB();

    const post = await Post.create(validData);

    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
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

    console.error('[POST /api/posts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
