'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Generic React error boundary page (app/error.tsx).
 * Shown whenever an unhandled runtime error propagates through the
 * component tree of a route segment.
 *
 * Requirements: 13.4 — HTTP 500 responses must return the generic message
 * "Internal server error" and must not expose stack traces to the client.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to the browser console for developer visibility
    // without exposing it to the end user.
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0B0B3B] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error icon */}
        <div className="mb-6" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-20 w-20 text-[#F5C518]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-3">
          Something went wrong
        </h1>

        <p className="text-gray-400 mb-8">
          We&apos;re sorry — an unexpected error occurred. Please try again, or
          return to the home page if the problem persists.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Retry button — calls Next.js reset() to re-render the segment */}
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-[#F5C518] px-6 py-3 text-sm font-semibold text-[#0B0B3B] hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2 focus:ring-offset-[#0B0B3B] transition-colors"
            aria-label="Retry the failed page"
          >
            Try again
          </button>

          {/* Fallback navigation to home */}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0B0B3B] transition-colors"
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  );
}
