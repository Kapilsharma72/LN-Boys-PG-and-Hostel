import Link from 'next/link';

/**
 * BranchCard — Renders a card for a single branch.
 *
 * Server Component.
 * Requirements: 2.3, 2.4, 2.5
 *
 * IMPORTANT behavioral distinction (tested by property tests):
 * - active branches: render an <a> tag (navigable link) to /branch/[branchId]
 * - coming-soon branches: render a disabled <button> (NOT an <a> tag)
 */

export interface BranchCardProps {
  branchId: string;
  name: string;
  startingPrice: number;
  rating: number;
  city: string;
  status: 'active' | 'coming-soon';
  /** Optional address for the Locations page */
  address?: string;
  /** Optional occupancy types for the Locations page */
  occupancyTypes?: string[];
}

/** Formats a number as Indian Rupee currency string, e.g. 8000 → "₹8,000" */
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BranchCard({
  branchId,
  name,
  startingPrice,
  rating,
  city,
  status,
  address,
  occupancyTypes,
}: BranchCardProps) {
  const isActive = status === 'active';

  const cardContent = (
    <div className="flex flex-col h-full p-6">
      {/* Status badge */}
      <div className="flex items-start justify-between mb-3">
        <span
          className={[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            isActive
              ? 'bg-green-900/50 text-green-300'
              : 'bg-yellow-900/50 text-yellow-300',
          ].join(' ')}
        >
          {isActive ? 'Active' : 'Coming Soon'}
        </span>
      </div>

      {/* Branch name */}
      <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">{name}</h3>

      {/* City */}
      <p className="text-gray-400 text-sm mb-3">{city}</p>

      {/* Address (optional) */}
      {address && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{address}</p>
      )}

      {/* Occupancy types (optional) */}
      {occupancyTypes && occupancyTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {occupancyTypes.map((type) => (
            <span
              key={type}
              className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300"
            >
              {type}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto">
        {/* Price and rating */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[#F5C518] font-bold text-xl">
              {formatINR(startingPrice)}
            </span>
            <span className="text-gray-400 text-sm">/month</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-[#F5C518]"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="text-white text-sm font-medium">
              {rating.toFixed(1)}
            </span>
            <span className="text-gray-400 text-xs">/5</span>
          </div>
        </div>

        {/* CTA — active: link, coming-soon: disabled button */}
        {isActive ? (
          <span className="block w-full text-center px-4 py-2 rounded-lg font-semibold text-sm bg-[#F5C518] text-[#0B0B3B] hover:bg-yellow-400 transition-colors duration-150">
            View Details
          </span>
        ) : (
          <span className="block w-full text-center px-4 py-2 rounded-lg font-semibold text-sm bg-white/10 text-gray-500 cursor-not-allowed">
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );

  const cardClasses = [
    'block w-full h-full rounded-xl border',
    'bg-white/5',
    isActive
      ? 'border-white/20 hover:border-[#F5C518]/50 transition-colors duration-200'
      : 'border-white/10 opacity-75',
  ].join(' ');

  // Active branches: render as a navigable anchor
  if (isActive) {
    return (
      <Link
        href={`/branch/${branchId}`}
        className={[
          cardClasses,
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-[#F5C518]',
        ].join(' ')}
        aria-label={`View details for ${name}`}
      >
        {cardContent}
      </Link>
    );
  }

  // Coming-soon branches: render as a disabled button (NOT an <a> tag)
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      aria-label={`${name} — Coming soon`}
      className={[cardClasses, 'cursor-not-allowed text-left'].join(' ')}
    >
      {cardContent}
    </button>
  );
}
