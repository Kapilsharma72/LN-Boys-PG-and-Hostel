'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * PostDeleteButton (Client Component)
 *
 * Renders a delete button for a post row in the admin blog table.
 *
 * Behavior:
 * 1. First click → shows inline confirmation ("Are you sure? Confirm / Cancel")
 * 2. Confirm click → calls DELETE /api/posts/[id] with X-CSRF-Token header
 * 3. On success → refreshes the page (router.refresh()) to reflect the deletion
 * 4. On error → shows an inline error message
 *
 * Requirements: 12.4, 12.8 (CSRF on all state-mutating routes)
 */

interface PostDeleteButtonProps {
  postId: string;
  postTitle: string;
  csrfToken: string | null;
}

export default function PostDeleteButton({
  postId,
  postTitle,
  csrfToken,
}: PostDeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = () => {
    setError(null);
    setConfirming(true);
  };

  const handleCancel = () => {
    setConfirming(false);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!csrfToken) {
      setError('Missing CSRF token. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });

      // On 401 — session expired, redirect to login
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.error ?? 'Failed to delete post. Please try again.');
        setLoading(false);
        return;
      }

      // Refresh the server component data (re-fetches the post list)
      router.refresh();
    } catch (err) {
      console.error('[PostDeleteButton] Delete error:', err);
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  // Confirmation state
  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-1">Delete &ldquo;{postTitle}&rdquo;?</span>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            aria-label={`Confirm delete post "${postTitle}"`}
          >
            {loading ? (
              <>
                <svg
                  className="w-3 h-3 mr-1 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting…
              </>
            ) : (
              'Confirm'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            aria-label="Cancel delete"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 max-w-[200px] text-right" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Default delete button
  return (
    <button
      onClick={handleDeleteClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      aria-label={`Delete post "${postTitle}"`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      Delete
    </button>
  );
}
