import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongoose';
import Lead, { ILead } from '@/lib/db/models/Lead';
import { getSession } from '@/lib/auth/session';
import LeadStatusDropdown, { LeadStatus } from '@/components/admin/LeadStatusDropdown';

/**
 * Admin Leads Dashboard Page (Task 21.1)
 *
 * Requirements: 12.5, 12.6
 *
 * SSR page (force-dynamic, no cache) — always shows the latest leads from MongoDB.
 *
 * Features:
 *   - Paginated table (20 leads per page, newest first)
 *   - Columns: Name, Mobile, Intent, Branch, Status, Created Date, WhatsApp opt-in
 *   - Status dropdown per row → calls PATCH /api/leads/[id] with CSRF token
 *   - On 401 response → client redirects to /admin/login
 *   - Pagination controls with page number query param
 *
 * Auth is enforced upstream by middleware.ts, but we also double-check here
 * so that a 401 can be surfaced correctly from within the server component.
 */

// Disable caching — admin pages must always be SSR
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: 'Leads — LN Boys PG Admin',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface LeadRow {
  _id: string;
  name: string;
  mobile: string;
  intent: 'visit' | 'reserve';
  branchId: string;
  status: LeadStatus;
  whatsappOptIn: boolean;
  createdAt: string; // ISO string (serialisable across server→client boundary)
}

interface LeadsData {
  leads: LeadRow[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getLeads(page: number): Promise<LeadsData> {
  await connectDB();

  const skip = (page - 1) * PAGE_SIZE;

  const [rawLeads, totalCount] = await Promise.all([
    Lead.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean<(ILead & { _id: unknown })[]>(),
    Lead.countDocuments(),
  ]);

  const leads: LeadRow[] = rawLeads.map((lead) => ({
    _id: String(lead._id),
    name: lead.name,
    mobile: lead.mobile,
    intent: lead.intent,
    branchId: lead.branchId,
    status: lead.status as LeadStatus,
    whatsappOptIn: lead.whatsappOptIn,
    createdAt:
      lead.createdAt instanceof Date
        ? lead.createdAt.toISOString()
        : String(lead.createdAt),
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return { leads, totalCount, page, totalPages };
}

// ---------------------------------------------------------------------------
// Helper sub-components
// ---------------------------------------------------------------------------

function IntentBadge({ intent }: { intent: 'visit' | 'reserve' }) {
  if (intent === 'visit') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
        Visit
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
      Reserve
    </span>
  );
}

function WhatsAppOptIn({ optIn }: { optIn: boolean }) {
  if (optIn) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium text-green-700"
        title="WhatsApp opt-in"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20.472 3.528A11.95 11.95 0 0012 0C5.373 0 0 5.373 0 12a11.94 11.94 0 001.671 6.116L0 24l6.073-1.594A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12a11.95 11.95 0 00-3.528-8.472zM12 21.937a9.89 9.89 0 01-5.043-1.376l-.361-.215-3.607.947.964-3.524-.236-.375A9.9 9.9 0 012.063 12C2.063 6.514 6.514 2.063 12 2.063S21.937 6.514 21.937 12 17.486 21.937 12 21.937zm5.44-7.403c-.298-.149-1.765-.871-2.038-.97-.273-.099-.471-.149-.669.149-.199.298-.768.97-.941 1.169-.173.199-.347.224-.645.075-.298-.149-1.257-.464-2.393-1.476-.885-.79-1.483-1.766-1.657-2.064-.173-.298-.018-.459.13-.607.133-.133.298-.347.447-.521.149-.174.199-.298.298-.497.099-.199.05-.373-.025-.521-.075-.149-.669-1.611-.916-2.207-.241-.579-.487-.5-.669-.51l-.57-.01c-.199 0-.521.075-.794.373-.273.298-1.041 1.017-1.041 2.48 0 1.462 1.066 2.874 1.215 3.073.149.199 2.097 3.203 5.08 4.49.71.307 1.264.49 1.696.627.713.227 1.361.195 1.874.118.572-.085 1.765-.72 2.014-1.415.249-.695.249-1.29.174-1.415-.073-.124-.271-.199-.57-.347z" />
        </svg>
        Yes
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-400">No</span>
  );
}

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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">No leads yet</h3>
      <p className="text-sm text-gray-500">
        Visitor enquiries will appear here once they submit the enquiry form.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination controls
// ---------------------------------------------------------------------------

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

function Pagination({ page, totalPages, totalCount, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Build page numbers to show (always show first, last, and 2 around current)
  const pages: (number | 'ellipsis')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
    ) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <p className="text-sm text-gray-500">
        Showing{' '}
        <span className="font-medium text-gray-700">
          {startItem}–{endItem}
        </span>{' '}
        of{' '}
        <span className="font-medium text-gray-700">{totalCount}</span> leads
      </p>

      <nav aria-label="Lead list pagination" className="flex items-center gap-1">
        {/* Previous */}
        {page > 1 ? (
          <Link
            href={`/admin/leads?page=${page - 1}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
            aria-label="Previous page"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </Link>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-300 bg-white border border-gray-100 cursor-not-allowed"
            aria-disabled="true"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">
              …
            </span>
          ) : p === page ? (
            <span
              key={p}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-semibold bg-[#0B0B3B] text-white"
              aria-current="page"
              aria-label={`Page ${p}, current`}
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={`/admin/leads?page=${p}`}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
              aria-label={`Go to page ${p}`}
            >
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {page < totalPages ? (
          <Link
            href={`/admin/leads?page=${page + 1}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B]"
            aria-label="Next page"
          >
            Next
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-300 bg-white border border-gray-100 cursor-not-allowed"
            aria-disabled="true"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility — format date for display
// ---------------------------------------------------------------------------

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  // Guard: ensure the admin is authenticated server-side
  // middleware.ts should have already redirected, but this is a safety net
  // that also ensures a clean 401 response for any server-side checks.
  const session = await getSession();
  if (!session.adminId) {
    redirect('/admin/login');
  }

  // Parse page param
  const params = await searchParams;
  const rawPage = parseInt(params.page ?? '1', 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  // Fetch leads
  let data: LeadsData | null = null;
  let fetchError: string | null = null;

  try {
    data = await getLeads(page);

    // Clamp page to valid range after knowing totalPages
    if (page > data.totalPages) {
      redirect(`/admin/leads?page=${data.totalPages}`);
    }
  } catch (error) {
    console.error('[AdminLeadsPage] Failed to fetch leads:', error);
    fetchError = 'Failed to load leads. Please refresh the page.';
  }

  const leads = data?.leads ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Status breakdown counts (for the summary strip)
  const newCount = leads.filter((l) => l.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage visitor enquiries and booking requests
          </p>
        </div>

        {/* Summary badge — new leads count */}
        {!fetchError && totalCount > 0 && newCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700">
            <span
              className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
              aria-hidden="true"
            />
            {newCount} new on this page
          </span>
        )}
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
      {/* Leads table                                                         */}
      {/* ------------------------------------------------------------------ */}
      {!fetchError && leads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <EmptyState />
        </div>
      ) : (
        !fetchError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Summary strip */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{totalCount}</span>{' '}
                {totalCount === 1 ? 'lead' : 'leads'} total
                {page > 1 || totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
              </p>
              <p className="text-xs text-gray-400">
                Update the status dropdown in each row to track lead progress
              </p>
            </div>

            {/* Responsive table wrapper */}
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-100"
                aria-label="Leads list"
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Mobile
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Intent
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Branch
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      Created Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      WhatsApp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className={`hover:bg-gray-50 transition-colors ${
                        lead.status === 'new' ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {lead.name}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={`tel:+91${lead.mobile}`}
                          className="text-sm text-gray-700 font-mono hover:text-[#0B0B3B] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] rounded"
                          aria-label={`Call ${lead.name} at ${lead.mobile}`}
                        >
                          {lead.mobile}
                        </a>
                      </td>

                      {/* Intent */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <IntentBadge intent={lead.intent} />
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-mono">
                          {lead.branchId}
                        </span>
                      </td>

                      {/* Status dropdown (client component) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <LeadStatusDropdown
                          leadId={lead._id}
                          currentStatus={lead.status}
                        />
                      </td>

                      {/* Created date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <time
                          dateTime={lead.createdAt}
                          className="text-xs text-gray-500"
                        >
                          {formatDate(lead.createdAt)}
                        </time>
                      </td>

                      {/* WhatsApp opt-in */}
                      <td className="px-4 py-3 text-center">
                        <WhatsAppOptIn optIn={lead.whatsappOptIn} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
            />
          </div>
        )
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Info note about lead statuses                                       */}
      {/* ------------------------------------------------------------------ */}
      {!fetchError && (
        <aside className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-700">
          <p>
            <span className="font-semibold">Status workflow:</span>{' '}
            New → Contacted → Visited → Converted (or Closed).
            Changes are saved immediately. If your session has expired, you will be redirected to login.
          </p>
          <p className="mt-1.5">
            Leads highlighted in blue have <span className="font-semibold">New</span> status and require follow-up.
          </p>
        </aside>
      )}
    </div>
  );
}
