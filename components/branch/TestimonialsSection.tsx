/**
 * TestimonialsSection — Displays approved testimonials for a branch.
 *
 * Server Component (no 'use client' needed).
 * Requirements: 3.5
 *
 * Shows at most 10 approved testimonials ordered by date descending.
 * Each testimonial card displays: authorName, rating (1–5 stars, gold filled),
 * text, and formatted date.
 * Empty state shown when no approved testimonials exist.
 */

import { formatDate } from '@/lib/utils/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Testimonial {
  _id: string;
  branchId: string;
  authorName: string;
  rating: number; // 1–5 integer
  text: string;
  date: Date | string;
  approved: boolean;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of testimonials to display */
const MAX_TESTIMONIALS = 10;

/** Star rating configuration */
const STAR_FILLED = '★';
const STAR_EMPTY = '☆';
const STAR_COLOR_GOLD = '#F5C518';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sort testimonials by date descending and filter to approved only.
 * Returns at most MAX_TESTIMONIALS items.
 */
function prepareTestimonials(testimonials: Testimonial[]): Testimonial[] {
  return testimonials
    .filter((t) => t.approved === true)
    .sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, MAX_TESTIMONIALS);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  const displayTestimonials = prepareTestimonials(testimonials);

  // Empty state — no approved testimonials
  if (displayTestimonials.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-white/10 bg-white/5"
        role="status"
        aria-label="No testimonials available"
      >
        <span className="text-4xl mb-3" aria-hidden="true">
          💬
        </span>
        <p className="text-gray-400 text-sm text-center">
          Be the first to share your experience.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayTestimonials.map((testimonial) => (
        <TestimonialCard key={testimonial._id} testimonial={testimonial} />
      ))}
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { authorName, rating, text, date } = testimonial;

  // Generate star rating display (1-5 filled stars in gold, rest empty/outline)
  const stars = Array.from({ length: 5 }, (_, index) => {
    const isFilled = index < rating;
    return (
      <span
        key={index}
        style={{ color: isFilled ? STAR_COLOR_GOLD : '#6B7280' }}
        className="text-lg leading-none"
        aria-hidden="true"
      >
        {isFilled ? STAR_FILLED : STAR_EMPTY}
      </span>
    );
  });

  return (
    <article
      className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-colors duration-150"
      aria-label={`Review by ${authorName}`}
    >
      {/* Header: author name + star rating */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {authorName}
          </h4>
        </div>
        <div
          className="flex items-center gap-0.5"
          role="img"
          aria-label={`Rating: ${rating} out of 5 stars`}
        >
          {stars}
        </div>
      </div>

      {/* Review text */}
      <p className="text-sm text-white/80 leading-relaxed mb-3 whitespace-pre-wrap">
        {text}
      </p>

      {/* Date */}
      <time
        className="text-xs text-gray-400"
        dateTime={typeof date === 'string' ? date : date.toISOString()}
      >
        {formatDate(date)}
      </time>
    </article>
  );
}
