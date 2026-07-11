import Link from 'next/link';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import { cookies } from 'next/headers';
import BranchDeleteButton from '@/components/admin/BranchDeleteButton';

/**
 * Admin Branches List Page (Task 20.1)
 *
 * Requirements: 12.4
 *
 * SSR page (no cache) — always shows the latest branch data from MongoDB.
 *
 * Displays a table of all branches with:
 *   - Branch name, branchId (slug), city, status badge, starting price, rating
 *   - Edit action → navigates to /admin/branches/[id]
 *   - Delete action → calls DELETE /api/branches/[id] with CSRF header (client-side)
 *   - "Add New Branch" button → navigates to /admin/branches/new
 *
 * Auth is enforced upstream by middleware.ts — no session check needed here.
 */

// Disable Next.js caching — admin pages must always be SSR (no static cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: 'Branches — LN Boys PG Admin',
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

interface BranchRow {
  _id: string;
  branchId: string;
  name: string;
  city: string;
  status: 'active' | 'coming-soon';
  startingPrice: number;
  rating: number;
  phone: string[];
  createdAt: Date;
}

async function getBranches(): Promise<BranchRow[]> {
  await connectDB();
  const branches = await Branch.find()
    .select('branchId name city status startingPrice rating phone createdAt')
    .sort({ createdAt: -1 })
    .lean<BranchRow[]>();
  return branches;
}

// ---------------------------------------------------------------------------
// Status Badge component
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'active' | 'coming-soon' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" aria-hidden="true" />
      Coming Soon
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty state component
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div
        className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">No branches yet</h3>
      <p className="text-sm text-gray-500 mb-6">
        Get started by adding your first hostel branch.
      </p>
      <Link
        href="/admin/branches/new"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add First Branch
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminBranchesPage() {
  // Read CSRF token server-side to pass to the client delete button
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf-token')?.value ?? null;

  let branches: BranchRow[] = [];
  let fetchError: string | null = null;

  try {
    branches = await getBranches();
  } catch (error) {
    console.error('[AdminBranchesPage] Failed to fetch branches:', error);
    fetchError = 'Failed to load branches. Please refresh the page.';
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all LN Boys PG &amp; Hostel branch locations
          </p>
        </div>

        <Link
          href="/admin/branches/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Branch
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error state                                                         */}
      {/* ------------------------------------------------------------------ */}
      {fetchError && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {fetchError}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Branches table / empty state                                        */}
      {/* ------------------------------------------------------------------ */}
      {!fetchError && branches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <EmptyState />
        </div>
      ) : (
        !fetchError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Summary strip */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{branches.length}</span>{' '}
                {branches.length === 1 ? 'branch' : 'branches'} total
                {' · '}
                <span className="text-green-700 font-medium">
                  {branches.filter((b) => b.status === 'active').length} active
                </span>
                {' · '}
                <span className="text-yellow-700 font-medium">
                  {branches.filter((b) => b.status === 'coming-soon').length} coming soon
                </span>
              </p>
            </div>

            {/* Responsive table wrapper */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100" aria-label="Branch list">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Branch
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Starting Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Rating
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {branches.map((branch) => (
                    <tr
                      key={branch.branchId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Branch name & ID */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {branch.name}
                          </span>
                          <span className="text-xs text-gray-400 font-mono mt-0.5">
                            {branch.branchId}
                          </span>
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {branch.city}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={branch.status} />
                      </td>

                      {/* Starting price */}
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        ₹{branch.startingPrice.toLocaleString('en-IN')}/mo
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-[#F5C518]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            {branch.rating.toFixed(1)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Sub-section links */}
                          <div className="hidden lg:flex items-center gap-1 mr-2">
                            {[
                              { label: 'Rooms', suffix: 'rooms' },
                              { label: 'Amenities', suffix: 'amenities' },
                              { label: 'Food', suffix: 'food-menu' },
                              { label: 'Gallery', suffix: 'gallery' },
                            ].map(({ label, suffix }) => (
                              <Link
                                key={suffix}
                                href={`/admin/branches/${branch.branchId}/${suffix}`}
                                className="px-2 py-1 text-xs rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
                                aria-label={`Manage ${label} for ${branch.name}`}
                              >
                                {label}
                              </Link>
                            ))}
                          </div>

                          {/* Edit button */}
                          <Link
                            href={`/admin/branches/${branch.branchId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            aria-label={`Edit branch ${branch.name}`}
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </Link>

                          {/* Delete button (client component — needs CSRF) */}
                          <BranchDeleteButton
                            branchId={branch.branchId}
                            branchName={branch.name}
                            csrfToken={csrfToken}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Branch sub-section quick-nav                                        */}
      {/* ------------------------------------------------------------------ */}
      {branches.length > 0 && (
        <section aria-labelledby="branch-subsections-heading" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2
            id="branch-subsections-heading"
            className="text-base font-semibold text-gray-800 mb-4"
          >
            Manage Sub-sections per Branch
          </h2>
          <div className="space-y-4">
            {branches.map((branch) => (
              <div key={`sub-${branch.branchId}`} className="space-y-2">
                <p className="text-sm font-medium text-gray-700">{branch.name}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Rooms', suffix: 'rooms' },
                    { label: 'Amenities', suffix: 'amenities' },
                    { label: 'Food Menu', suffix: 'food-menu' },
                    { label: 'Testimonials', suffix: 'testimonials' },
                    { label: 'Policies', suffix: 'policies' },
                    { label: 'Landmarks', suffix: 'landmarks' },
                    { label: 'Gallery', suffix: 'gallery' },
                  ].map(({ label, suffix }) => (
                    <Link
                      key={suffix}
                      href={`/admin/branches/${branch.branchId}/${suffix}`}
                      className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-[#F5C518] hover:text-[#0B0B3B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
