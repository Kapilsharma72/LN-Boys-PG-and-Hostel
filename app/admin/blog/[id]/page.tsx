import { redirect } from 'next/navigation';
import Link from 'next/link';
import { connectDB } from '@/lib/db/mongoose';
import Post, { IPost } from '@/lib/db/models/Post';
import BlogPostForm, { BlogPostInitialValues } from '@/components/admin/BlogPostForm';

/**
 * Admin — Edit Blog Post Page (Task 21.3)
 *
 * Requirements: 8.3
 *
 * - Fetches post by MongoDB _id directly (not via API)
 * - Passes post data to BlogPostForm as initialValues (edit mode)
 * - If post not found → redirect to /admin/blog
 * - Renders BlogPostForm in edit mode pre-populated with existing values
 * - Zod client-side validation via react-hook-form
 * - Submits PATCH /api/posts/[id] with X-CSRF-Token header
 * - On 200 shows success message in-place
 * - 422 server errors shown inline without clearing fields
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    await connectDB();
    const post = await Post.findById(id).select('title').lean<Pick<IPost, 'title'>>();
    if (post) {
      return { title: `Edit: ${post.title} — LN Boys PG Admin` };
    }
  } catch {
    // fall through to default
  }
  return { title: 'Edit Post — LN Boys PG Admin' };
}

// ---------------------------------------------------------------------------
// Data fetching — direct DB access (not via API)
// ---------------------------------------------------------------------------

async function getPost(id: string): Promise<IPost | null> {
  try {
    await connectDB();
    return await Post.findById(id).lean<IPost>();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    redirect('/admin/blog');
  }

  // Map Mongoose document to BlogPostForm initialValues
  const initialValues: BlogPostInitialValues = {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    publishedAt: post.publishedAt,
    tags: post.tags ?? [],
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    published: post.published,
  };

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
            {post.title}
          </span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update the content and settings for{' '}
          <span className="font-medium text-gray-700">{post.title}</span>
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Form card                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <BlogPostForm mode="edit" postId={String(post._id)} initialValues={initialValues} />
      </div>
    </div>
  );
}
