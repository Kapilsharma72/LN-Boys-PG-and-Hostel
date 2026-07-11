"use client";

import { createContext, useContext, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * CSRF Context for admin mutations
 *
 * The CSRF token is read server-side from the cookie (set by /api/auth/login)
 * and passed down via React Context. All mutation forms/actions use this hook
 * to include the X-CSRF-Token header.
 */
const CsrfContext = createContext<string | null>(null);

export function useCsrfToken(): string | null {
  return useContext(CsrfContext);
}

interface AdminLayoutClientProps {
  csrfToken: string | null;
  children: ReactNode;
}

/**
 * AdminLayoutClient — Client-side admin layout with sidebar navigation
 *
 * Task 19.1: Admin root layout
 * - Sidebar nav with links to all admin sections (dashboard, branches, leads, blog)
 * - CSRF token provided via React Context for all mutations
 * - No Navbar/Footer/WhatsAppFAB (admin-only layout)
 *
 * Navigation structure (based on design folder structure):
 * - Dashboard: /admin/dashboard
 * - Branches: /admin/branches (with sub-sections for each branch)
 * - Leads: /admin/leads
 * - Blog: /admin/blog
 * - Logout: client-side POST to /api/auth/logout
 */
export default function AdminLayoutClient({
  csrfToken,
  children,
}: AdminLayoutClientProps) {
  const pathname = usePathname();

  // Helper to determine if a nav link is active
  const isActive = (path: string): boolean => {
    if (path === "/admin/dashboard") {
      return pathname === path;
    }
    return pathname?.startsWith(path) ?? false;
  };

  // Handle logout
  const handleLogout = async () => {
    if (!csrfToken) {
      window.location.href = "/admin/login";
      return;
    }

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      });

      if (response.ok) {
        window.location.href = "/admin/login";
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again.");
    }
  };

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <CsrfContext.Provider value={csrfToken}>{children}</CsrfContext.Provider>;
  }

  return (
    <CsrfContext.Provider value={csrfToken}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-[#0B0B3B] text-white flex flex-col">
          {/* Brand Header */}
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-xl font-bold">LN Boys PG</h1>
            <p className="text-sm text-gray-400">Admin Panel</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavLink
              href="/admin/dashboard"
              active={isActive("/admin/dashboard")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </NavLink>

            <NavLink
              href="/admin/branches"
              active={isActive("/admin/branches")}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Branches
            </NavLink>

            <NavLink href="/admin/leads" active={isActive("/admin/leads")}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Leads
            </NavLink>

            <NavLink href="/admin/blog" active={isActive("/admin/blog")}>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Blog Posts
            </NavLink>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </CsrfContext.Provider>
  );
}

/**
 * NavLink — Sidebar navigation link component
 */
interface NavLinkProps {
  href: string;
  active: boolean;
  children: ReactNode;
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors
        ${
          active
            ? "bg-[#F5C518] text-[#0B0B3B] font-semibold"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }
      `}
    >
      {children}
    </Link>
  );
}
