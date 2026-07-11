import Link from 'next/link';
import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Lead from '@/lib/db/models/Lead';
import Post from '@/lib/db/models/Post';

/**
 * Admin Dashboard Page (Task 19.3)
 *
 * Requirements: 12.4
 *
 * SSR page (no cache) — always shows fresh summary counts from the database.
 *
 * Displays:
 *   - Total branch count (with active / coming-soon breakdown)
 *   - Total leads count (with 'new' leads count)
 *   - Total posts count (with published / draft breakdown)
 *
 * Links to all admin sub-sections:
 *   - /admin/branches
 *   - /admin/leads
 *   - /admin/blog
 *
 * Auth is enforced upstream by middleware.ts — no additional session check
 * is needed here.
 */

// Disable Next.js caching — admin pages must always be SSR (no static cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Data fetching helpers
// ---------------------------------------------------------------------------

interface DashboardCounts {
  branches: {
    total: number;
    active: number;
    comingSoon: number;
  };
  leads: {
    total: number;
    newLeads: number;
  };
  posts: {
    total: number;
    published: number;
    drafts: number;
  };
}

async function getDashboardCounts(): Promise<DashboardCounts> {
  await connectDB();

  const [
    totalBranches,
    activeBranches,
    totalLeads,
    newLeads,
    totalPosts,
    publishedPosts,
  ] = await Promise.all([
    Branch.countDocuments(),
    Branch.countDocuments({ status: 'active' }),
    Lead.countDocuments(),
    Lead.countDocuments({ status: 'new' }),
    Post.countDocuments(),
    Post.countDocuments({ published: true }),
  ]);

  return {
    branches: {
      total: totalBranches,
      active: activeBranches,
      comingSoon: totalBranches - activeBranches,
    },
    leads: {
      total: totalLeads,
      newLeads,
    },
    posts: {
      total: totalPosts,
      published: publishedPosts,
      drafts: totalPosts - publishedPosts,
    },
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  count: number;
  description: string;
  href: string;
  ctaLabel: string;
  accentColor: string;
  icon: React.ReactNode;
  badges?: { label: string; value: number; color: string }[];
}

function StatCard({
  title,
  count,
  description,
  href,
  ctaLabel,
  accentColor,
  icon,
  badges,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${accentColor}`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <span className="text-4xl font-bold text-gray-900" aria-label={`${title}: ${count}`}>
          {count}
        </span>
      </div>

      {/* Title & description */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>

      {/* Optional breakdown badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
            >
              {badge.label}: {badge.value}
            </span>
          ))}
        </div>
      )}

      {/* CTA link */}
      <Link
        href={href}
        className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[#0B0B3B] hover:text-[#F5C518] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
      >
        {ctaLabel}
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  );
}

interface QuickLinkProps {
  href: string;
  label: string;
  description: string;
}

function QuickLink({ href, label, description }: QuickLinkProps) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-[#F5C518] hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
    >
      <div>
        <p className="text-sm font-semibold text-gray-800 group-hover:text-[#0B0B3B]">
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <svg
        className="w-5 h-5 text-gray-400 group-hover:text-[#F5C518] transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  let counts: DashboardCounts;

  try {
    counts = await getDashboardCounts();
  } catch (error) {
    console.error('[AdminDashboardPage] Failed to fetch counts:', error);
    // Render zeroed counts rather than crashing the page
    counts = {
      branches: { total: 0, active: 0, comingSoon: 0 },
      leads: { total: 0, newLeads: 0 },
      posts: { total: 0, published: 0, drafts: 0 },
    };
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your hostel content and enquiries
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary stat cards                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Summary counts">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Branches */}
          <StatCard
            title="Branches"
            count={counts.branches.total}
            description="Physical hostel locations"
            href="/admin/branches"
            ctaLabel="Manage branches"
            accentColor="bg-blue-100 text-blue-600"
            badges={[
              {
                label: 'Active',
                value: counts.branches.active,
                color: 'bg-green-100 text-green-700',
              },
              {
                label: 'Coming soon',
                value: counts.branches.comingSoon,
                color: 'bg-yellow-100 text-yellow-700',
              },
            ]}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            }
          />

          {/* Leads */}
          <StatCard
            title="Leads"
            count={counts.leads.total}
            description="Visitor enquiries and bookings"
            href="/admin/leads"
            ctaLabel="View all leads"
            accentColor="bg-purple-100 text-purple-600"
            badges={[
              {
                label: 'New',
                value: counts.leads.newLeads,
                color: 'bg-red-100 text-red-700',
              },
            ]}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
          />

          {/* Posts */}
          <StatCard
            title="Blog Posts"
            count={counts.posts.total}
            description="Articles and local guides"
            href="/admin/blog"
            ctaLabel="Manage blog"
            accentColor="bg-emerald-100 text-emerald-600"
            badges={[
              {
                label: 'Published',
                value: counts.posts.published,
                color: 'bg-green-100 text-green-700',
              },
              {
                label: 'Draft',
                value: counts.posts.drafts,
                color: 'bg-gray-100 text-gray-600',
              },
            ]}
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Quick links to all admin sub-sections                               */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="quick-links-heading">
        <h2
          id="quick-links-heading"
          className="text-lg font-semibold text-gray-800 mb-4"
        >
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink
            href="/admin/branches"
            label="Branch List"
            description="View, create, and manage hostel branches"
          />
          <QuickLink
            href="/admin/leads"
            label="Leads Dashboard"
            description="Review and update visitor enquiries"
          />
          <QuickLink
            href="/admin/blog"
            label="Blog Posts"
            description="Write and publish local guide articles"
          />
          <QuickLink
            href="/admin/blog/new"
            label="New Blog Post"
            description="Draft a new article or local guide"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Branch sub-section links (shown when at least one branch exists)    */}
      {/* ------------------------------------------------------------------ */}
      {counts.branches.total > 0 && (
        <section aria-labelledby="branch-sections-heading">
          <h2
            id="branch-sections-heading"
            className="text-lg font-semibold text-gray-800 mb-4"
          >
            Branch Sub-sections
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Select a branch from{' '}
            <Link
              href="/admin/branches"
              className="text-[#0B0B3B] font-medium hover:underline"
            >
              Branches
            </Link>{' '}
            to access rooms, amenities, food menu, testimonials, policies,
            landmarks, and gallery management.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { label: 'Rooms', suffix: '/rooms' },
              { label: 'Amenities', suffix: '/amenities' },
              { label: 'Food Menu', suffix: '/food-menu' },
              { label: 'Testimonials', suffix: '/testimonials' },
              { label: 'Policies', suffix: '/policies' },
              { label: 'Landmarks', suffix: '/landmarks' },
              { label: 'Gallery', suffix: '/gallery' },
            ].map(({ label, suffix }) => (
              <Link
                key={suffix}
                href="/admin/branches"
                className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:border-[#F5C518] hover:text-[#0B0B3B] hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
                aria-label={`Go to Branches to manage ${label}`}
                title={`Navigate to Branches → select a branch → ${label}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
