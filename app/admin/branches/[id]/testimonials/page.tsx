import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Testimonial from '@/lib/db/models/Testimonial';
import TestimonialsManager, { TestimonialRow } from '@/components/admin/TestimonialsManager';

/**
 * Admin Testimonials Page (Task 20.6)
 *
 * Requirements: 12.7
 *
 * SSR page — fetches the branch and all its testimonials (approved and pending)
 * server-side, then hands off approve/reject and delete operations to the
 * TestimonialsManager client component.
 *
 * When a Testimonial is rejected (approved: false) it is excluded from the
 * public Branch Detail Page testimonials section (see Requirement 12.7).
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
    title: `Testimonials — ${id} — LN Boys PG Admin`,
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

interface RawTestimonial {
  _id: unknown;
  branchId: string;
  authorName: string;
  rating: number;
  text: string;
  // Mongoose returns a Date from the DB; we serialize it below
  date: Date | string;
  approved: boolean;
}

async function getTestimonials(branchId: string): Promise<TestimonialRow[]> {
  await connectDB();
  // Fetch ALL testimonials (both approved and pending) for admin view,
  // sorted most recent first
  const testimonials = await Testimonial.find({ branchId })
    .select('branchId authorName rating text date approved')
    .sort({ date: -1 })
    .lean<RawTestimonial[]>();

  // Serialize _id and date to plain strings for safe client-side rendering
  return testimonials.map((t) => ({
    ...t,
    _id: String(t._id),
    date: t.date instanceof Date ? t.date.toISOString() : String(t.date),
  }));
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBranchTestimonialsPage({ params }: PageProps) {
  const { id } = await params;

  let branch: BranchBasic | null = null;
  let testimonials: TestimonialRow[] = [];
  let fetchError: string | null = null;

  try {
    branch = await getBranch(id);
    if (!branch) {
      notFound();
    }
    testimonials = await getTestimonials(id);
  } catch (error) {
    console.error(
      `[AdminBranchTestimonialsPage] Failed to fetch data for branch ${id}:`,
      error
    );
    fetchError = 'Failed to load testimonial data. Please refresh the page.';
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
          Testimonials
        </span>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
          {branch && (
            <p className="text-sm text-gray-500 mt-1">
              Moderate reviews for{' '}
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
      {/* Testimonials manager (client component)                          */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && branch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <TestimonialsManager branchId={id} initialTestimonials={testimonials} />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Info note about moderation behaviour                             */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && (
        <aside className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
          <p>
            <span className="font-semibold">Moderation rules:</span>{' '}
            Only <span className="font-semibold">approved</span> testimonials are shown on the
            public Branch Detail Page (Requirement 12.7). Rejecting a testimonial sets{' '}
            <code className="bg-blue-100 px-1 rounded">approved: false</code> and hides it
            immediately from the public view. Deleted testimonials are permanently removed.
          </p>
        </aside>
      )}
    </div>
  );
}
