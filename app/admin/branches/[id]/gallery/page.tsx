import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Gallery from '@/lib/db/models/Gallery';
import GalleryManager, { GalleryItemRow } from '@/components/admin/GalleryManager';

/**
 * Admin Gallery Page (Task 20.9)
 *
 * Requirements: 11.1, 11.5
 *
 * SSR page — fetches the branch and all its gallery items server-side, then
 * delegates upload + delete management to the GalleryManager client component.
 *
 * Upload constraints (enforced both client-side and in the API route):
 *   - Accepted types: JPEG, PNG, WebP, MP4
 *   - Maximum file size: 50 MB
 *   - Required metadata: category, altText (1–200 chars)
 *
 * On upload failure the GalleryManager retains the file selection so the admin
 * can retry without re-selecting the file (Requirement 11.5).
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
    title: `Gallery — ${id} — LN Boys PG Admin`,
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

interface RawGalleryItem {
  _id: unknown;
  branchId: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  category: 'room' | 'common-area' | 'food' | 'exterior' | 'event';
  altText: string;
  uploadedAt: Date | string;
}

async function getGalleryItems(branchId: string): Promise<GalleryItemRow[]> {
  await connectDB();
  const items = await Gallery.find({ branchId })
    .sort({ uploadedAt: -1 })
    .lean<RawGalleryItem[]>();

  return items.map((item) => ({
    ...item,
    _id: String(item._id),
    uploadedAt:
      item.uploadedAt instanceof Date
        ? item.uploadedAt.toISOString()
        : String(item.uploadedAt),
  }));
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBranchGalleryPage({ params }: PageProps) {
  const { id } = await params;

  let branch: BranchBasic | null = null;
  let galleryItems: GalleryItemRow[] = [];
  let fetchError: string | null = null;

  try {
    branch = await getBranch(id);
    if (!branch) {
      notFound();
    }
    galleryItems = await getGalleryItems(id);
  } catch (error) {
    console.error(
      `[AdminBranchGalleryPage] Failed to fetch data for branch ${id}:`,
      error
    );
    fetchError = 'Failed to load gallery data. Please refresh the page.';
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
          Gallery
        </span>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* Page header                                                       */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          {branch && (
            <p className="text-sm text-gray-500 mt-1">
              Manage photos and videos for{' '}
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
            { label: 'Landmarks', suffix: 'landmarks' },
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
      {/* Gallery manager (client component)                               */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && branch && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <GalleryManager branchId={id} initialItems={galleryItems} />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Info note                                                         */}
      {/* ---------------------------------------------------------------- */}
      {!fetchError && (
        <aside className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
          <p>
            <span className="font-semibold">Accepted formats:</span> JPEG, PNG, WebP (images)
            and MP4 (video). Maximum file size is <span className="font-semibold">50 MB</span>.
          </p>
          <p className="mt-1.5">
            <span className="font-semibold">Alt text:</span> Provide a concise description of
            each media item (1–200 characters). This is used for accessibility and public
            gallery display.
          </p>
          <p className="mt-1.5">
            <span className="font-semibold">Cloudinary:</span> Deleted items are removed from
            both the database and Cloudinary storage. This action cannot be undone.
          </p>
        </aside>
      )}
    </div>
  );
}
