import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Amenity from '@/lib/db/models/Amenity';
import AmenitiesManager, { AmenityRow } from '@/components/admin/AmenitiesManager';

/**
 * Admin Amenities Page (Task 20.4)
 *
 * Requirements: 1.3, 1.11
 *
 * SSR page — fetches the branch and its amenities server-side, then hands off
 * CRUD management to the AmenitiesManager client component.
 *
 * Field-level validation for name and category is enforced both:
 * - Client-side: Zod + react-hook-form inside AmenitiesManager
 * - Server-side: Zod in the API route handler
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
    title: `Amenities — ${id} — LN Boys PG Admin`,
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

async function getAmenities(branchId: string): Promise<AmenityRow[]> {
  await connectDB();
  const amenities = await Amenity.find({ branchId })
    .select('branchId name icon category')
    .sort({ category: 1, name: 1 })
    .lean<AmenityRow[]>();
  return amenities;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBranchAmenitiesPage({ params }: PageProps) {
  const { id } = await params;

  let branch: BranchBasic | null = null;
  let amenities: AmenityRow[] = [];
  let fetchError: string | null = null;

  try {
    branch = await getBranch(id);
    if (!branch) {
      notFound();
    }
    amenities = await getAmenities(id);
  } catch (error) {
    console.error(
      `[AdminBranchAmenitiesPage] Failed to fetch data for branch ${id}:`,
      error
    );
    fetchError = 'Failed to load amenity data. Please refresh the page.';
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
          Amenities
        </span>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>
          {branch && (
            <p className="text-sm text-gray-500 mt-1">
              Manage amenities for{' '}
              <span className="font-medium text-gray-700">{branch.name}</span>
            </p>
          )}
        </div>

        {/* Sub-section quick-nav */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
          {[
            { label: 'Rooms', suffix: 'rooms' },
            { label: 'Food Menu', suffix: 'food-menu' },
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
      {/* Amenities CRUD (client component)                                */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && branch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <AmenitiesManager branchId={id} initialAmenities={amenities} />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Info note about field validation                                  */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && (
        <aside className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
          <p>
            <span className="font-semibold">Validation rules:</span>{' '}
            Name is required (1–100 characters). Category must be one of Basic, Safety, Comfort,
            or Food. Icon is required (emoji or icon name, 1–100 characters).
          </p>
        </aside>
      )}
    </div>
  );
}
