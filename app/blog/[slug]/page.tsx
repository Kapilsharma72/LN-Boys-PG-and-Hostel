import { notFound } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';
import { connectDB } from '@/lib/db/mongoose';
import Post from '@/lib/db/models/Post';
import { formatDate } from '@/lib/utils/formatters';
import SanitizedContent from '@/components/blog/SanitizedContent';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// ISR — revalidate every hour. Blog post content rarely changes; ISR keeps
// the page fast while allowing content updates to propagate within an hour.
// ---------------------------------------------------------------------------
export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PostDocument {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date | string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  published: boolean;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ---------------------------------------------------------------------------
// generateStaticParams — pre-renders all published post pages at build time.
// Only published posts are included so unpublished drafts are never pre-built.
// ---------------------------------------------------------------------------
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    await connectDB();
    const posts = await Post.find({ published: true })
      .select('slug')
      .lean<{ slug: string }[]>();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    // If DB is unavailable at build time, skip pre-rendering.
    return [];
  }
}

// ---------------------------------------------------------------------------
// Data fetching helper
// Returns the post document if it exists AND is published; otherwise null.
// ---------------------------------------------------------------------------
async function getPublishedPost(slug: string): Promise<PostDocument | null> {
  try {
    await connectDB();
    const post = await Post.findOne({ slug, published: true })
      .select('slug title excerpt content author publishedAt tags metaTitle metaDescription published')
      .lean<PostDocument>();
    return post ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// generateMetadata — dynamic per-post SEO metadata.
// Returns 404-safe fallback when the post is not found or is unpublished.
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found | LN Boys PG & Hostel',
      description: 'The blog post you are looking for does not exist.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';
  const pageUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: pageUrl,
      type: 'article',
      publishedTime:
        post.publishedAt instanceof Date
          ? post.publishedAt.toISOString()
          : post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

// ---------------------------------------------------------------------------
// Marked configuration
// Use synchronous rendering (string output) with sensible defaults:
// - gfm: GitHub Flavoured Markdown (tables, strikethrough, task lists)
// - breaks: convert single newlines to <br> for friendlier formatting
// ---------------------------------------------------------------------------
marked.setOptions({
  gfm: true,
  breaks: true,
});

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch post — notFound() for non-existent OR unpublished slugs (Req 8.4)
  const post = await getPublishedPost(slug);
  if (!post) {
    notFound();
  }

  // Convert Markdown → HTML on the server (synchronous marked call).
  // DOMPurify sanitization happens client-side in <SanitizedContent>.
  const rawHtml = marked.parse(post.content) as string;

  const publishedIso =
    post.publishedAt instanceof Date
      ? post.publishedAt.toISOString()
      : post.publishedAt;

  return (
    <div className="min-h-screen bg-[#0B0B3B]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Back link */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#F5C518] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5C518] rounded"
          >
            <span aria-hidden="true">←</span>
            <span>Back to Blog</span>
          </Link>
        </nav>

        {/* Article header */}
        <article>
          <header className="mb-8">
            {/* Tags */}
            {post.tags.length > 0 && (
              <ul
                role="list"
                aria-label="Post tags"
                className="flex flex-wrap gap-2 mb-4"
              >
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-[#1a1a5e] text-[#F5C518] border border-[#F5C518]/30">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
              {post.title}
            </h1>

            {/* Author and date */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
              <span>
                By{' '}
                <span className="text-gray-200 font-medium">{post.author}</span>
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={publishedIso} className="text-gray-400">
                {formatDate(post.publishedAt)}
              </time>
            </div>
          </header>

          {/* Markdown content rendered as sanitized HTML */}
          <SanitizedContent
            html={rawHtml}
            className="prose prose-invert prose-lg max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-[#F5C518] prose-a:underline hover:prose-a:text-yellow-300
              prose-strong:text-white
              prose-code:text-[#F5C518] prose-code:bg-[#12124a] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[#12124a] prose-pre:border prose-pre:border-[#1e1e6e]
              prose-blockquote:border-l-[#F5C518] prose-blockquote:text-gray-400
              prose-ul:text-gray-300 prose-ol:text-gray-300
              prose-li:text-gray-300
              prose-hr:border-[#1e1e6e]
              prose-img:rounded-lg prose-img:mx-auto"
          />

          {/* Bottom back link */}
          <footer className="mt-12 pt-8 border-t border-[#1e1e6e]">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#F5C518] hover:underline focus:outline-none focus:ring-2 focus:ring-[#F5C518] rounded"
            >
              <span aria-hidden="true">←</span>
              <span>Back to all articles</span>
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
