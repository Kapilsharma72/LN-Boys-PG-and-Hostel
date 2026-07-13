/**
 * PgImageCard — Visual card for each PG hostel block.
 *
 * Server Component.
 * Shows a real hostel photo, PG badge, name, address, price, room types and status.
 * Active cards link to the branch detail page; coming-soon cards show an overlay.
 */

import Link from 'next/link';
import Image from 'next/image';

export interface PgImageCardProps {
  branchId: string;
  pgNumber: 'I' | 'II' | 'III';
  name: string;
  address: string;
  startingPrice: number;
  status: 'active' | 'coming-soon';
  roomTypesLabel?: string;
  /** Optional photo URL — falls back to a gradient placeholder */
  imageUrl?: string;
}

/** Hostel room photos from Unsplash (free to use) */
const DEFAULT_IMAGES: Record<string, string> = {
  I: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=75&auto=format&fit=crop',
  II: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=75&auto=format&fit=crop',
  III: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=75&auto=format&fit=crop',
};

export default function PgImageCard({
  branchId,
  pgNumber,
  name,
  address,
  startingPrice,
  status,
  roomTypesLabel = '2 & 3 Seater • AC / Non-AC / Cooler',
  imageUrl,
}: PgImageCardProps) {
  const isActive = status === 'active';
  const photo = imageUrl ?? DEFAULT_IMAGES[pgNumber];

  const cardContent = (
    <div
      className={[
        'relative rounded-2xl overflow-hidden h-[340px] w-full group',
        'flex flex-col justify-end',
        isActive
          ? 'border border-[#F5C518]/20 hover:border-[#F5C518]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-[#F5C518]/15 cursor-pointer'
          : 'border border-white/10',
      ].join(' ')}
    >
      {/* ── Real hostel photo ── */}
      <Image
        src={photo}
        alt={`${name} — hostel room photo`}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className={[
          'object-cover object-center transition-transform duration-500',
          isActive ? 'group-hover:scale-105' : '',
        ].join(' ')}
        unoptimized
      />

      {/* Dark gradient so text is always readable */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0B0B3B]/95 via-[#0B0B3B]/40 to-[#0B0B3B]/10"
        aria-hidden="true"
      />

      {/* PG Number badge — top-left */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F5C518] text-[#0B0B3B] font-extrabold text-sm shadow-lg">
          {pgNumber}
        </span>
      </div>

      {/* Status badge — top-right */}
      <div className="absolute top-4 right-4 z-10">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-900/70 text-green-300 ring-1 ring-green-600/40 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-900/70 text-yellow-300 ring-1 ring-yellow-600/40 backdrop-blur-sm">
            Coming Soon
          </span>
        )}
      </div>

      {/* Content — bottom */}
      <div className="relative z-10 p-5">
        {/* PG name */}
        <h3 className="text-white font-bold text-lg leading-snug mb-1">
          {name}
        </h3>

        {/* Address */}
        <p className="text-gray-300 text-xs leading-relaxed mb-2 line-clamp-2">
          📍 {address}
        </p>

        {/* Room types */}
        <p className="text-gray-400 text-xs mb-4">
          🛏 {roomTypesLabel}
        </p>

        {/* Price row */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#F5C518] font-bold text-2xl">
              ₹{startingPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-gray-400 text-xs ml-1">/month</span>
            <p className="text-gray-500 text-[10px] mt-0.5">incl. 3 meals · electricity extra</p>
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1 text-[#F5C518] text-xs font-semibold bg-[#F5C518]/10 px-3 py-1.5 rounded-lg group-hover:bg-[#F5C518]/20 transition-colors">
              View Details
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Coming-soon overlay */}
      {!isActive && (
        <div
          className="absolute inset-0 bg-[#0B0B3B]/60 flex items-center justify-center z-20"
          aria-label="Coming soon"
        >
          <div className="bg-[#F5C518] text-[#0B0B3B] font-extrabold text-sm px-6 py-3 rounded-full shadow-xl rotate-[-3deg] select-none">
            🚧 Coming Soon
          </div>
        </div>
      )}
    </div>
  );

  if (isActive) {
    return (
      <Link
        href={`/branch/${branchId}`}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F5C518] focus-visible:outline-offset-2 rounded-2xl"
        aria-label={`View details for ${name}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div aria-label={`${name} — coming soon`} role="img">
      {cardContent}
    </div>
  );
}
