import { cookies } from "next/headers";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

/**
 * Admin root layout (Task 19.1)
 *
 * Requirements:
 * - No Navbar/Footer/WhatsAppFAB (unlike public pages)
 * - Sidebar navigation with links to all admin sections
 * - Reads CSRF token cookie server-side and passes to client for mutations
 *
 * Design: All admin routes use SSR (no caching); auth is enforced by
 * middleware.ts which redirects unauthenticated users to /admin/login.
 *
 * CSRF flow:
 * 1. Server reads `csrf-token` cookie (set by /api/auth/login)
 * 2. Cookie value is passed to client component via props
 * 3. Client stores token in React state/context
 * 4. All mutation requests (POST/PATCH/DELETE) include X-CSRF-Token header
 *
 * Related: Requirement 12.1 (admin panel structure), 12.8 (CSRF protection)
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read CSRF token from cookie (set by login route)
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get("csrf-token")?.value || null;

  return (
    <AdminLayoutClient csrfToken={csrfToken}>
      {children}
    </AdminLayoutClient>
  );
}
