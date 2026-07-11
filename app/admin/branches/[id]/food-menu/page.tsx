import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import FoodMenu from '@/lib/db/models/FoodMenu';
import FoodMenuManager, { FoodMenuRow } from '@/components/admin/FoodMenuManager';

/**
 * Admin Food Menu Page (Task 20.5)
 *
 * Requirements: 1.4, 1.11
 *
 * SSR page — fetches the branch and its food menu entries server-side, then
 * hands off CRUD management to the FoodMenuManager client component.
 *
 * Field-level validation for day, meal, and items is enforced both:
 * - Client-side: Zod + react-hook-form inside FoodMenuManager
 * - Server-side: Zod in the API route handler
 *
 * The POST endpoint performs an upsert: if a (branchId, day, meal) entry already
 * exists it is updated; otherwise a new document is created.
 *
 * Auth is enforced upstream by middleware.ts.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Food Menu — ${id} — LN Boys PG Admin`,
  };
}

// ---------------------------------------------------------------------------
// Data fetching helpers
// ---------------------------------------------------------------------------

interface BranchBasic {
  branchId: string;
  name: string;
}

async function getBranch(branchId: string): Promise<BranchBasic | null> {
  await connectDB();
  const branch = await Branch.findOne({ branchId })
    .select('branchId name')
    .lean<BranchBasic>();
  return branch;
}

async function getFoodMenuEntries(branchId: string): Promise<FoodMenuRow[]> {
  await connectDB();
  const entries = await FoodMenu.find({ branchId })
    .select('branchId day meal items')
    .sort({ day: 1, meal: 1 })
    .lean<FoodMenuRow[]>();
  return entries;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBranchFoodMenuPage({ params }: PageProps) {
  const { id } = await params;

  let branch: BranchBasic | null = null;
  let entries: FoodMenuRow[] = [];
  let fetchError: string | null = null;

  try {
    branch = await getBranch(id);
    if (!branch) {
      notFound();
    }
    entries = await getFoodMenuEntries(id);
  } catch (error) {
    console.error(
      `[AdminBranchFoodMenuPage] Failed to fetch data for branch ${id}:`,
      error
    );
    fetchError = 'Failed to load food menu data. Please refresh the page.';
  }

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* Breadcrumb navigation                                             */}
      {/* ---------------------------------------------------------------- */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/admin/branches"
          className="hover:text-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] rounded"
        >
          Branches
        </Link>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/admin/branches/${id}`}
          className="hover:text-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] rounded"
        >
          {branch?.name ?? id}
        </Link>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium" aria-current="page">
          Food Menu
        </span>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food Menu</h1>
          {branch && (
            <p className="text-sm text-gray-500 mt-1">
              Manage the weekly meal plan for{' '}
              <span className="font-medium text-gray-700">{branch.name}</span>
            </p>
          )}
        </div>

        {/* Sub-section quick-nav */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
          {[
            { label: 'Rooms', suffix: 'rooms' },
            { label: 'Amenities', suffix: 'amenities' },
            { label: 'Testimonials', suffix: 'testimonials' },
            { label: 'Policies', suffix: 'policies' },
            { label: 'Landmarks', suffix: 'landmarks' },
            { label: 'Gallery', suffix: 'gallery' },
          ].map(({ label, suffix }) => (
            <Link
              key={suffix}
              href={`/admin/branches/${id}/${suffix}`}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-[#F5C518] hover:text-[#0B0B3B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Error state                                                       */}
      {/* ---------------------------------------------------------------- */}
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

      {/* ---------------------------------------------------------------- */}
      {/* Food Menu CRUD (client component)                                */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && branch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <FoodMenuManager branchId={id} initialEntries={entries} />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Info note about field validation and upsert behaviour            */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && (
        <aside className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
          <p>
            <span className="font-semibold">Validation rules:</span>{' '}
            Day must be a full day name (Monday–Sunday). Meal must be Breakfast, Lunch, or Dinner.
            Items are required — at least 1, up to 20 items, each 1–100 characters.
          </p>
          <p className="mt-1.5">
            <span className="font-semibold">Upsert behaviour:</span>{' '}
            Submitting an entry for an existing (day, meal) combination will <em>replace</em> its
            items. There is one entry per meal per day per branch.
          </p>
        </aside>
      )}
    </div>
  );
}
