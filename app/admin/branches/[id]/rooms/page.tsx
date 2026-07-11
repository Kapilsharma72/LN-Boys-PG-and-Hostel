import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Room from '@/lib/db/models/Room';
import RoomsManager, { RoomRow } from '@/components/admin/RoomsManager';

/**
 * Admin Rooms Page (Task 20.3)
 *
 * Requirements: 1.2, 1.11
 *
 * SSR page — fetches the branch and its rooms server-side, then hands off
 * CRUD management to the RoomsManager client component.
 *
 * Field-level validation for occupancyType and pricePerMonth is enforced both
 * client-side (Zod + react-hook-form inside RoomsManager) and server-side
 * (Zod in the API route handler).
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
    title: `Rooms — ${id} — LN Boys PG Admin`,
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

async function getRooms(branchId: string): Promise<RoomRow[]> {
  await connectDB();
  const rooms = await Room.find({ branchId })
    .select('branchId occupancyType pricePerMonth description available')
    .sort({ occupancyType: 1, pricePerMonth: 1 })
    .lean<RoomRow[]>();
  return rooms;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBranchRoomsPage({ params }: PageProps) {
  const { id } = await params;

  let branch: BranchBasic | null = null;
  let rooms: RoomRow[] = [];
  let fetchError: string | null = null;

  try {
    branch = await getBranch(id);
    if (!branch) {
      notFound();
    }
    rooms = await getRooms(id);
  } catch (error) {
    console.error(`[AdminBranchRoomsPage] Failed to fetch data for branch ${id}:`, error);
    fetchError = 'Failed to load room data. Please refresh the page.';
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
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/admin/branches/${id}`}
          className="hover:text-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] rounded"
        >
          {branch?.name ?? id}
        </Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium" aria-current="page">Rooms</span>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          {branch && (
            <p className="text-sm text-gray-500 mt-1">
              Manage room types and pricing for{' '}
              <span className="font-medium text-gray-700">{branch.name}</span>
            </p>
          )}
        </div>

        {/* Sub-section quick-nav */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
          {[
            { label: 'Amenities', suffix: 'amenities' },
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
      {/* Rooms CRUD (client component)                                    */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && branch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <RoomsManager branchId={id} initialRooms={rooms} />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Info note about field validation                                  */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && (
        <aside className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
          <p>
            <span className="font-semibold">Validation rules:</span>{' '}
            Occupancy type must be Single, Double, or Triple. Price per month must be between
            ₹0.01 and ₹9,99,999.99. Description is optional (max 500 characters).
          </p>
        </aside>
      )}
    </div>
  );
}
