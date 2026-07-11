import Link from 'next/link';
import BlogPostForm from '@/components/admin/BlogPostForm';

/**
 * Admin — Create New Blog Post Page (Task 21.3)
 *
 * Requirements: 8.3
 *
 * - Renders BlogPostForm in create mode with no initial data
 * - Zod client-side validation via react-hook-form
 * - Field-level inline errors on blur/invalid input
 * - Submits POST /api/posts with X-CSRF-Token header
 * - On 201 redirects to /admin/blog
 * - 422 server errors shown inline without clearing fields
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'New Post — LN Boys PG Admin',
};

export default function AdminNewPostPage() {
  return (
    <div className="max-w-5xl space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Breadcrumb / header                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-gray-500 mb-4"
        >
          <Link
            href="/admin/blog"
            className="hover:text-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B0B3B] rounded"
          >
            Blog Posts
          </Link>
          <svg
            className="w-4 h-4 flex-shrink-0 text-gray-300"
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
          <span className="text-gray-900 font-medium" aria-current="page">
            New Post
          </span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in all required fields to publish a new blog post.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Form card                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <BlogPostForm mode="create" />
      </div>
    </div>
  );
}
