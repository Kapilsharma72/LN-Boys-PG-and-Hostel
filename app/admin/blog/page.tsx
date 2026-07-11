import Link from 'next/link';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db/mongoose';
import Post, { IPost } from '@/lib/db/models/Post';
import PostDeleteButton from '@/components/admin/PostDeleteButton';

/**
 * Admin Blog List Page (Task 21.2)
 *
 * Requirements: 12.4
 *
 * SSR page (force-dynamic, no cache) — always shows the latest posts from MongoDB.
 *
 * Displays a table of all posts (published and drafts) with:
 *   - Title, Slug, Status badge (Published / Draft), Published Date
 *   - Edit action → navigates to /admin/blog/[id]
 *   - Delete action → calls DELETE /api/posts/[id] with CSRF header (client-side)
 *   - "New Post" button → navigates to /admin/blog/new
 *
 * Auth is enforced upstream by middleware.ts — no session check needed here.
 */

// Disable Next.js caching — admin pages must always be SSR (no static cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: 'Blog Posts — LN Boys PG Admin',
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface PostRow {
  _id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string; // ISO string (serialisable across server→client boundary)
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getPosts(): Promise<PostRow[]> {
  await connectDB();

  const posts = await Post.find()
    .select('title slug published publishedAt')
    .sort({ publishedAt: -1 })
    .lean<(IPost & { _id: unknown })[]>();

  return posts.map((p) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    published: p.published,
    publishedAt:
      p.publishedAt instanceof Date
        ? p.publishedAt.toISOString()
        : String(p.publishedAt),
  }));
}

// ---------------------------------------------------------------------------
// Status Badge component
// ---------------------------------------------------------------------------

function StatusBadge({ published }: { published: boolean }) {
  if (published) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
      Draft
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty state component
// ---------------------------------------------------------------------------

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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">No posts yet.</h3>
      <p className="text-sm text-gray-500 mb-6">
        Get started by creating your first blog post.
      </p>
      <Link
        href="/admin/blog/new"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
      >
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create First Post
      </Link>
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
    });
  } catch {
    return isoString;
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminBlogPage() {
  // Read CSRF token server-side to pass to the client delete button
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get('csrf-token')?.value ?? null;

  let posts: PostRow[] = [];
  let fetchError: string | null = null;

  try {
    posts = await getPosts();
  } catch (error) {
    console.error('[AdminBlogPage] Failed to fetch posts:', error);
    fetchError = 'Failed to load posts. Please refresh the page.';
  }

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage published articles and drafts
          </p>
        </div>

        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0B3B] text-white text-sm font-medium hover:bg-[#1a1a5e] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B0B3B]"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Post
        </Link>
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
      {/* Posts table / empty state                                           */}
      {/* ------------------------------------------------------------------ */}
      {!fetchError && posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <EmptyState />
        </div>
      ) : (
        !fetchError && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Summary strip */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{posts.length}</span>{' '}
                {posts.length === 1 ? 'post' : 'posts'} total
                {' · '}
                <span className="text-green-700 font-medium">{publishedCount} published</span>
                {' · '}
                <span className="text-yellow-700 font-medium">{draftCount} draft</span>
              </p>
            </div>

            {/* Responsive table wrapper */}
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-100"
                aria-label="Blog posts list"
              >
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Slug
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      Published Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {posts.map((post) => (
                    <tr
                      key={post._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Title */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900 line-clamp-2 max-w-xs">
                          {post.title}
                        </span>
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500 font-mono">
                          {post.slug}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge published={post.published} />
                      </td>

                      {/* Published date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <time
                          dateTime={post.publishedAt}
                          className="text-xs text-gray-500"
                        >
                          {formatDate(post.publishedAt)}
                        </time>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit button */}
                          <Link
                            href={`/admin/blog/${post._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            aria-label={`Edit post "${post.title}"`}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </Link>

                          {/* Delete button (client component — needs CSRF) */}
                          <PostDeleteButton
                            postId={post._id}
                            postTitle={post.title}
                            csrfToken={csrfToken}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
