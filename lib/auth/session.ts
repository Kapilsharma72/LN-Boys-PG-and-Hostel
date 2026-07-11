import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

// ---------------------------------------------------------------------------
// Session data shape
// ---------------------------------------------------------------------------

export interface SessionData {
  adminId?: string;
}

// ---------------------------------------------------------------------------
// iron-session configuration
// ---------------------------------------------------------------------------

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,   // 32+ char random secret (see .env.example)
  cookieName: 'ln-admin-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,                  // 24 hours in seconds
  },
};

// ---------------------------------------------------------------------------
// getSession() — App Router helper
// Wraps getIronSession for use in Server Components and Route Handlers.
// ---------------------------------------------------------------------------

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
