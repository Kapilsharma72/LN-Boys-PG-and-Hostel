import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Landmark from '@/lib/db/models/Landmark';
import LandmarksManager, { LandmarkRow } from '@/components/admin/LandmarksManager';

/**
 * Admin Landmarks Page (Task 20.8)
 *
 * Requirements: 1.7
 *
 * SSR page — fetches the branch and its landmarks server-side, then hands off
 * CRUD management to the LandmarksManager client component.
 *
 * Fields: name (required, 1–120 chars), category (college | hospital | transport | other),
 *         distanceMetres (non-negative integer), googleMapsUrl (valid URL, 1–500 chars).
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
    title: `Landmarks — ${id} — LN Boys PG Admin`,
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

async function getLandmarks(branchId: string): Promise<LandmarkRow[]> {
  await connectDB();
  const landmarks = await Landmark.find({ branchId })
    .select('branchId name category distanceMetres googleMapsUrl')
    .sort({ category: 1, name: 1 })
    .lean<LandmarkRow[]>();
  return landmarks;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBranchLandmarksPage({ params }: PageProps) {
  const { id } = await params;

  let branch: BranchBasic | null = null;
  let landmarks: LandmarkRow[] = [];
  let fetchError: string | null = null;

  try {
    branch = await getBranch(id);
    if (!branch) {
      notFound();
    }
    landmarks = await getLandmarks(id);
  } catch (error) {
    console.error(
      `[AdminBranchLandmarksPage] Failed to fetch data for branch ${id}:`,
      error
    );
    fetchError = 'Failed to load landmark data. Please refresh the page.';
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
          Landmarks
        </span>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landmarks</h1>
          {branch && (
            <p className="text-sm text-gray-500 mt-1">
              Manage nearby places and points of interest for{' '}
              <span className="font-medium text-gray-700">{branch.name}</span>
            </p>
          )}
        </div>

        {/* Sub-section quick-nav */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
          {[
            { label: 'Rooms', suffix: 'rooms' },
            { label: 'Amenities', suffix: 'amenities' },
            { label: 'Food Menu', suffix: 'food-menu' },
            { label: 'Testimonials', suffix: 'testimonials' },
            { label: 'Policies', suffix: 'policies' },
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
      {/* Landmarks CRUD (client component)                                */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && branch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <LandmarksManager branchId={id} initialLandmarks={landmarks} />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Info note about field validation                                  */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && (
        <aside className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
          <p>
            <span className="font-semibold">Validation rules:</span>{' '}
            Name is required (1–120 characters). Category must be one of College, Hospital,
            Transport, or Other. Distance must be a non-negative whole number (in metres).
            Google Maps URL must be a valid URL (1–500 characters).
          </p>
          <p className="mt-1.5">
            Landmarks appear in the &ldquo;Around This Place&rdquo; section on the branch
            detail page, grouped by category with a &ldquo;Get Directions&rdquo; link.
          </p>
        </aside>
      )}
    </div>
  );
}
