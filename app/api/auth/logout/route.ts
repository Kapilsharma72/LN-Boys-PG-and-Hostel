import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// POST /api/auth/logout
//
// Admin logout handler.
//
// Requirements: 12.3
//
// Steps:
//  1. Check session → 401 if no `adminId`
//  2. Validate CSRF → 403 if invalid
//  3. Destroy session: call `session.destroy()`
//  4. Clear both cookies on the response (maxAge: 0)
//  5. Return { success: true } (200)
//
// @returns 200 { success: true }
// @returns 401 { success: false, error: string }  — not authenticated
// @returns 403 { success: false, error: string }  — invalid CSRF token
// @returns 500 { success: false, error: string }  — unexpected error
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Check session — must be authenticated
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 },
      );
    }

    // 2. Validate CSRF token (double-submit cookie pattern)
    const csrfHeader = request.headers.get('X-CSRF-Token');
    const csrfCookie = (await cookies()).get('csrf-token')?.value;

    if (!validateCsrfToken(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 },
      );
    }

    // 3. Destroy the iron-session
    session.destroy();

    // 4. Clear both cookies on the response
    const response = NextResponse.json({ success: true });
    response.cookies.set('ln-admin-session', '', { maxAge: 0, path: '/' });
    response.cookies.set('csrf-token', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error) {
    console.error('[POST /api/auth/logout] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
