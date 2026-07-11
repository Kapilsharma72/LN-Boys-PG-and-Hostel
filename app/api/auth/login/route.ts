import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/auth/session';
import { generateCsrfToken } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// Request body schema
// ---------------------------------------------------------------------------

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
//
// Admin login handler.
//
// Requirements: 12.3
//
// Steps:
//  1. Zod-validate body: { username, password }
//  2. Compare username against ADMIN_USERNAME env var
//  3. bcryptjs.compare(password, ADMIN_PASSWORD_HASH)
//  4. On success: set iron-session adminId + CSRF cookie, return 200
//  5. On credential mismatch: return 401
//  6. On invalid body: return 400
//
// @returns 200 { success: true }
// @returns 400 { success: false, error: string }  — invalid body
// @returns 401 { success: false, error: "Invalid credentials" }  — wrong creds
// @returns 500 { success: false, error: "Internal server error" }
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 },
      );
    }

    const { username, password } = validation.data;

    // 2. Compare username
    const adminUsername = process.env.ADMIN_USERNAME ?? 'iamSatu';
    const adminPasswordHash =
      process.env.ADMIN_PASSWORD_HASH ??
      '$2b$12$oZHUoHx4dr9dlU1hCNv9uOeusthGhZWktHCgBRWFpOlblMmUfWXjq';

    if (!adminUsername || !adminPasswordHash) {
      console.error('[POST /api/auth/login] ADMIN_USERNAME or ADMIN_PASSWORD_HASH env vars not set');
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 },
      );
    }

    if (username !== adminUsername) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // 3. bcryptjs password comparison
    const passwordMatch = await bcryptjs.compare(password, adminPasswordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // 4. Credentials valid — create session and CSRF token

    // Set iron-session using the cookie store (works with App Router)
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.adminId = 'admin';
    await session.save();

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Build response and attach CSRF cookie (non-HTTP-only so JS can read it)
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // must be readable by client-side JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[POST /api/auth/login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
