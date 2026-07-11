/**
 * OccupancyPricingTable — Displays room cards grouped by occupancy type,
 * with AC / Cooler / Non-AC variant badges from the `description` field.
 *
 * Server Component.
 * Requirements: 3.3
 *
 * Rooms are grouped into Double (2-seater) and Triple (3-seater) sections.
 * Within each section, cards show: occupancy icon, variant badge, price,
 * and availability status.
 */

import { formatINR } from '@/lib/utils/formatters';

export interface Room {
  _id: string;
  branchId: string;
  occupancyType: 'Single' | 'Double' | 'Triple';
  pricePerMonth: number;
  amenities: string[];
  description: string;
  available: boolean;
}

interface OccupancyPricingTableProps {
  rooms: Room[];
}

/** Canonical display order for occupancy types */
const OCCUPANCY_ORDER: Room['occupancyType'][] = ['Single', 'Double', 'Triple'];

/** Human-friendly labels for occupancy types */
const OCCUPANCY_LABELS: Record<Room['occupancyType'], string> = {
  Single: '1-Seater (Single)',
  Double: '2-Seater (Double)',
  Triple: '3-Seater (Triple)',
};

/** Variant display config */
const VARIANT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  AC: { label: 'AC', bg: 'bg-blue-900/40', text: 'text-blue-300' },
  Cooler: { label: 'Cooler', bg: 'bg-cyan-900/40', text: 'text-cyan-300' },
  'Non-AC': { label: 'Non-AC', bg: 'bg-gray-800/60', text: 'text-gray-300' },
};

export default function OccupancyPricingTable({ rooms }: OccupancyPricingTableProps) {
  if (!rooms || rooms.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-white/10 bg-white/5"
        role="status"
        aria-label="No room data available"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-gray-600 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <p className="text-gray-400 text-sm">Room pricing information is not yet available.</p>
      </div>
    );
  }

  // Group rooms by occupancyType
  const grouped = new Map<Room['occupancyType'], Room[]>();
  for (const type of OCCUPANCY_ORDER) {
    const filtered = rooms.filter((r) => r.occupancyType === type);
    if (filtered.length > 0) {
      grouped.set(type, filtered);
    }
  }

  return (
    <div className="space-y-6" aria-label="Room types and pricing">
      {OCCUPANCY_ORDER.map((type) => {
        const group = grouped.get(type);
        if (!group) return null;

        return (
          <div key={type}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-3">
              <OccupancyIcon type={type} />
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider">
                {OCCUPANCY_LABELS[type]}
              </h4>
            </div>

            {/* Room cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.map((room) => {
                const variantKey = room.description?.trim() || '';
                const variant = VARIANT_CONFIG[variantKey] ?? {
                  label: variantKey || 'Standard',
                  bg: 'bg-white/10',
                  text: 'text-gray-300',
                };

                return (
                  <div
                    key={room._id}
                    className={[
                      'rounded-xl border p-4',
                      'bg-white/[0.03]',
                      room.available ? 'border-white/10' : 'border-white/5 opacity-60',
                    ].join(' ')}
                  >
                    {/* Variant badge + availability */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1',
                          variant.bg,
                          variant.text,
                          'ring-white/10',
                        ].join(' ')}
                      >
                        {variant.label}
                      </span>

                      {room.available ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 ring-1 ring-green-700/40"
                          aria-label="Available"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true" />
                          Available
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800/60 text-gray-400 ring-1 ring-gray-700/40"
                          aria-label="Not available"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" aria-hidden="true" />
                          Not Available
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-[#F5C518] font-bold text-xl">
                        {formatINR(room.pricePerMonth)}
                      </span>
                      <span className="text-gray-400 text-xs">/month</span>
                    </div>

                    {/* Description if present and not a known variant */}
                    {room.description && !VARIANT_CONFIG[room.description.trim()] && (
                      <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                        {room.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Small icon representing each occupancy type */
function OccupancyIcon({ type }: { type: Room['occupancyType'] }) {
  const iconCount = type === 'Single' ? 1 : type === 'Double' ? 2 : 3;

  return (
    <span
      className="flex items-center gap-0.5 text-[#F5C518]"
      aria-hidden="true"
      title={`${type} occupancy`}
    >
      {Array.from({ length: iconCount }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      ))}
    </span>
  );
}
