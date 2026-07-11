import Link from 'next/link';
import { connectDB } from '@/lib/db/mongoose';
import Post from '@/lib/db/models/Post';
import { formatDate } from '@/lib/utils/formatters';
import type { Metadata } from 'next';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';

export const metadata: Metadata = {
  title: 'Blog & Reviews | LN Boys PG & Hostel Jaipur',
  description: 'Student reviews, hostel tips, food menu updates, and local Jaipur guides from LN Boys PG & Hostel.',
  openGraph: {
    title: 'Blog & Reviews | LN Boys PG & Hostel Jaipur',
    description: 'Student reviews, hostel tips, and local Jaipur guides.',
    url: `${siteUrl}/blog`,
    type: 'website',
  },
};

const POSTS_PER_PAGE = 9;

interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | string;
  author: string;
  tags: string[];
}

interface PageResult {
  posts: PostSummary[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

async function getPublishedPosts(page: number): Promise<PageResult> {
  const safePage = page < 1 ? 1 : page;
  const skip = (safePage - 1) * POSTS_PER_PAGE;
  try {
    await connectDB();
    const [posts, totalCount] = await Promise.all([
      Post.find({ published: true })
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(POSTS_PER_PAGE)
        .select('slug title excerpt publishedAt author tags')
        .lean<PostSummary[]>(),
      Post.countDocuments({ published: true }),
    ]);
    return { posts, totalCount, currentPage: safePage, totalPages: Math.ceil(totalCount / POSTS_PER_PAGE) };
  } catch {
    return { posts: [], totalCount: 0, currentPage: safePage, totalPages: 0 };
  }
}

/** Static blog posts shown when DB has no posts */
const STATIC_POSTS = [
  {
    slug: 'best-pg-near-jecrc-jaipur',
    title: 'Best Boys PG Near JECRC University, Jaipur — Complete Guide 2025',
    excerpt: 'Looking for a safe, affordable PG near JECRC University Vidhani? Here\'s everything you need to know — amenities, pricing, food, and what to look for before booking.',
    publishedAt: '2025-01-15',
    author: 'LN Team',
    tags: ['Guide', 'JECRC', 'Jaipur'],
    readTime: '5 min',
  },
  {
    slug: 'hostel-vs-pg-jaipur-students',
    title: 'Hostel vs PG — What\'s Better for College Students in Jaipur?',
    excerpt: 'Confused between a hostel and a PG? We break down the key differences in cost, freedom, food, and safety — and what most JECRC students actually prefer.',
    publishedAt: '2025-02-08',
    author: 'LN Team',
    tags: ['Tips', 'Students'],
    readTime: '4 min',
  },
  {
    slug: 'sitapura-jaipur-student-area-guide',
    title: 'Sitapura & Vidhani Area Guide for Students — Food, Travel & More',
    excerpt: 'New to Jaipur? Here\'s a complete guide to the Sitapura-Vidhani area — nearest hospitals, markets, food joints, and how to get around.',
    publishedAt: '2025-02-20',
    author: 'LN Team',
    tags: ['Guide', 'Jaipur', 'Local'],
    readTime: '6 min',
  },
  {
    slug: 'food-menu-pg-jaipur',
    title: 'What We Serve: A Look at Our Weekly Food Menu',
    excerpt: 'Wondering what food looks like at LN Boys PG? From Monday Poha to Sunday Paneer Butter Masala — see our full 7-day meal plan.',
    publishedAt: '2025-03-01',
    author: 'LN Team',
    tags: ['Food', 'Menu'],
    readTime: '3 min',
  },
  {
    slug: 'checklist-joining-pg-hostel',
    title: 'Moving to a PG? Your Complete Packing & Checklist Guide',
    excerpt: 'First time moving out of home? Here\'s exactly what to bring, what to leave, and what you\'ll find ready at LN Boys PG.',
    publishedAt: '2025-03-15',
    author: 'LN Team',
    tags: ['Tips', 'Students'],
    readTime: '4 min',
  },
  {
    slug: 'free-auto-jecrc-service',
    title: 'Free Electric Auto to JECRC — How Our Transport Service Works',
    excerpt: 'Tired of booking autos daily? We run a free electric auto service twice a day for all our residents. Here\'s the timing, route, and how to use it.',
    publishedAt: '2025-04-01',
    author: 'LN Team',
    tags: ['Transport', 'JECRC'],
    readTime: '3 min',
  },
];

const TAG_COLORS: Record<string, string> = {
  Guide: 'bg-blue-900/40 text-blue-300',
  JECRC: 'bg-purple-900/40 text-purple-300',
  Jaipur: 'bg-orange-900/40 text-orange-300',
  Tips: 'bg-cyan-900/40 text-cyan-300',
  Students: 'bg-green-900/40 text-green-300',
  Food: 'bg-yellow-900/40 text-yellow-300',
  Menu: 'bg-amber-900/40 text-amber-300',
  Transport: 'bg-indigo-900/40 text-indigo-300',
  Local: 'bg-rose-900/40 text-rose-300',
};

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  return (
    <nav aria-label="Blog pagination" className="flex items-center justify-center gap-2 mt-12">
      {hasPrev ? (
        <Link href={`/blog?page=${currentPage - 1}`} className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-[#F5C518] hover:text-[#0B0B3B] transition-colors border border-white/10">← Prev</Link>
      ) : (
        <span className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-gray-600 cursor-not-allowed border border-white/5">← Prev</span>
      )}
      <span className="px-4 py-2 text-sm text-gray-400">{currentPage} / {totalPages}</span>
      {hasNext ? (
        <Link href={`/blog?page=${currentPage + 1}`} className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-[#F5C518] hover:text-[#0B0B3B] transition-colors border border-white/10">Next →</Link>
      ) : (
        <span className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-gray-600 cursor-not-allowed border border-white/5">Next →</span>
      )}
    </nav>
  );
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const rawPage = parseInt(params.page ?? '1', 10);
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const { posts: dbPosts, totalPages } = await getPublishedPosts(currentPage);

  // Use DB posts if available, else show static editorial posts
  const showStatic = dbPosts.length === 0 && currentPage === 1;
  const displayPosts = showStatic ? STATIC_POSTS : dbPosts;

  return (
    <div className="min-h-screen bg-[#0B0B3B]">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0d0d45] via-[#0B0B3B] to-[#0B0B3B] border-b border-white/10 py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F5C518]/5 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1 rounded-full bg-[#F5C518]/10 text-[#F5C518] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#F5C518]/20">
            Blog & Guides
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Student <span className="text-[#F5C518]">Resources</span> & Tips
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Hostel guides, food updates, area maps, and everything a student needs to know before moving to Jaipur.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── POST GRID ─────────────────────────────────────────────── */}
        {displayPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📝</p>
            <p className="text-gray-400 text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayPosts.map((post) => {
              const isStatic = 'readTime' in post;
              const dateStr = typeof post.publishedAt === 'string' ? post.publishedAt : (post.publishedAt as Date).toISOString();
              const formattedDate = showStatic
                ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : formatDate(post.publishedAt);
              return (
                <article
                  key={post.slug}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#F5C518]/40 hover:bg-[#F5C518]/5 transition-all duration-200 overflow-hidden"
                >
                  {/* Colour top bar based on first tag */}
                  <div className={`h-1 w-full ${post.tags[0] === 'Guide' ? 'bg-blue-500' : post.tags[0] === 'Food' || post.tags[0] === 'Menu' ? 'bg-[#F5C518]' : post.tags[0] === 'Transport' ? 'bg-indigo-500' : 'bg-purple-500'}`} />

                  <div className="flex flex-col flex-1 p-6">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.slice(0, 2).map(tag => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-white/10 text-gray-300'}`}>
                          {tag}
                        </span>
                      ))}
                      {isStatic && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500 ml-auto">
                          {(post as typeof STATIC_POSTS[0]).readTime} read
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link href={`/blog/${post.slug}`} className="focus:outline-none focus:ring-2 focus:ring-[#F5C518] rounded-lg">
                      <h2 className="text-white font-bold text-base leading-snug mb-3 group-hover:text-[#F5C518] transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 flex-1 mb-4">
                      {post.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <time dateTime={dateStr} className="text-gray-500 text-xs">{formattedDate}</time>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#F5C518] hover:underline"
                        aria-label={`Read: ${post.title}`}
                      >
                        Read more →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination — only for DB posts */}
        {!showStatic && <Pagination currentPage={currentPage} totalPages={totalPages} />}

      </div>
    </div>
  );
}
