import Link from 'next/link';
import BranchForm from '@/components/admin/BranchForm';

/**
 * Admin — Create New Branch Page (Task 20.2)
 *
 * Requirements: 1.8 (branchId validation), 1.9 (field-level errors), 1.10 (422 errors)
 *
 * - Client-side Zod validation via react-hook-form
 * - Field-level inline errors on blur/invalid input
 * - Submits POST /api/branches with X-CSRF-Token header
 * - 422 server errors shown inline without clearing fields
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'New Branch — LN Boys PG Admin',
};

export default function AdminNewBranchPage() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Breadcrumb / header                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link
            href="/admin/branches"
            className="hover:text-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] rounded"
          >
            Branches
          </Link>
          <svg className="w-4 h-4 flex-shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium" aria-current="page">New Branch</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">Create New Branch</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in all required fields to add a new hostel location.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Form card                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <BranchForm mode="create" />
      </div>
    </div>
  );
}
