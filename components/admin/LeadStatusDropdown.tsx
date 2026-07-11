'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCsrfToken } from '@/components/admin/AdminLayoutClient';

/**
 * LeadStatusDropdown (Client Component)
 *
 * Renders an inline status <select> for a single lead row in the admin leads table.
 *
 * Behavior:
 * 1. Displays current status in a styled <select>
 * 2. On change → calls PATCH /api/leads/[id] with new status and X-CSRF-Token header
 * 3. On 401 → redirects to /admin/login (session expired)
 * 4. On other error → shows inline error; reverts the select to prior value
 * 5. On success → router.refresh() to re-sync server component data
 *
 * Requirements: 12.5, 12.6, 12.8
 */

export type LeadStatus = 'new' | 'contacted' | 'visited' | 'converted' | 'closed';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'visited', label: 'Visited' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
];

/** Tailwind color classes per status for visual distinction */
function getStatusClasses(status: LeadStatus): string {
  switch (status) {
    case 'new':
      return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400';
    case 'contacted':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-400';
    case 'visited':
      return 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-400';
    case 'converted':
      return 'bg-green-50 text-green-700 border-green-200 focus:ring-green-400';
    case 'closed':
      return 'bg-gray-100 text-gray-600 border-gray-300 focus:ring-gray-400';
  }
}

interface LeadStatusDropdownProps {
  leadId: string;
  currentStatus: LeadStatus;
}

export default function LeadStatusDropdown({
  leadId,
  currentStatus,
}: LeadStatusDropdownProps) {
  const router = useRouter();
  const csrfToken = useCsrfToken();

  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as LeadStatus;
    const previousStatus = status;

    // Optimistically update UI
    setStatus(newStatus);
    setSaving(true);
    setError(null);

    try {
      if (!csrfToken) {
        // No CSRF token — session likely expired
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        // Session expired — redirect to login
        window.location.href = '/admin/login';
        return;
      }

      const json = await response.json();

      if (!response.ok || !json.success) {
        // Revert to previous value on failure
        setStatus(previousStatus);
        setError(json.error ?? 'Failed to update status. Please try again.');
        return;
      }

      // Success — refresh server component data to keep everything in sync
      router.refresh();
    } catch (err) {
      console.error('[LeadStatusDropdown] PATCH error:', err);
      // Revert to previous value on network error
      setStatus(previousStatus);
      setError('Network error. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <select
          value={status}
          onChange={handleChange}
          disabled={saving}
          aria-label={`Update lead status, current: ${status}`}
          className={`
            text-xs font-medium rounded-md border px-2 py-1 pr-6 appearance-none
            cursor-pointer transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-1
            disabled:opacity-60 disabled:cursor-not-allowed
            ${getStatusClasses(status)}
          `}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        {saving ? (
          <span
            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <svg
              className="w-3 h-3 animate-spin text-current opacity-60"
              fill="none"
              viewBox="0 0 24 24"
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
          </span>
        ) : (
          <span
            className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <svg
              className="w-3 h-3 text-current opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        )}
      </div>

      {/* Inline error message */}
      {error && (
        <p className="text-xs text-red-600 max-w-[180px]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
