import { notFound } from 'next/navigation';
import Link from 'next/link';
import { connectDB } from '@/lib/db/mongoose';
import Branch, { IBranch } from '@/lib/db/models/Branch';
import BranchForm from '@/components/admin/BranchForm';
import { BranchCreateInput } from '@/lib/validations/branch';

/**
 * Admin — Edit Branch Page (Task 20.2)
 *
 * Requirements: 1.8 (branchId validation), 1.9 (field-level errors), 1.10 (422 errors)
 *
 * - Fetches existing branch data server-side by branchId slug
 * - Renders BranchForm pre-populated with existing values
 * - BranchForm submits PATCH /api/branches/[id] with X-CSRF-Token header
 * - 422 server errors shown inline without clearing fields
 * - branchId field is read-only in edit mode
 * - Returns 404 for unknown branchId slugs
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Edit Branch: ${id} — LN Boys PG Admin`,
  };
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getBranch(id: string): Promise<IBranch | null> {
  await connectDB();
  return Branch.findOne({ branchId: id }).lean<IBranch>();
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminEditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const branch = await getBranch(id);

  if (!branch) {
    notFound();
  }

  // Map Mongoose document to form default values
  const defaultValues: Partial<BranchCreateInput> = {
    branchId: branch.branchId,
    name: branch.name,
    address: branch.address,
    city: branch.city,
    state: branch.state,
    pincode: branch.pincode,
    phone: branch.phone.length > 0 ? branch.phone : [''],
    whatsapp: branch.whatsapp,
    startingPrice: branch.startingPrice,
    rating: branch.rating ?? 0,
    status: branch.status,
    occupancyTypes: branch.occupancyTypes.length > 0 ? branch.occupancyTypes : [''],
    latitude: branch.latitude ?? null,
    longitude: branch.longitude ?? null,
    metaTitle: branch.metaTitle ?? null,
    metaDescription: branch.metaDescription ?? null,
  };

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
          <svg
            className="w-4 h-4 flex-shrink-0 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium" aria-current="page">
            {branch.name}
          </span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">Edit Branch</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the details for{' '}
          <span className="font-medium text-gray-700">{branch.name}</span>{' '}
          <span className="font-mono text-xs text-gray-400">({branch.branchId})</span>
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sub-section quick links                                              */}
      {/* ------------------------------------------------------------------ */}
      <nav
        aria-label="Branch sub-sections"
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Manage sub-sections
        </p>
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
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-[#F5C518] hover:text-[#0B0B3B] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Form card                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <BranchForm
          mode="edit"
          branchId={branch.branchId}
          defaultValues={defaultValues}
        />
      </div>
    </div>
  );
}
