'use client';

/**
 * InfoTabs — Tab panel for the Branch Detail Page.
 *
 * Client Component (wraps the client-side Tabs component).
 * Requirements: 3.3
 *
 * Three tabs:
 *  1. "Occupancy & Pricing" (default active) — renders OccupancyPricingTable
 *  2. "Amenities"                            — renders AmenitiesGrid
 *  3. "Details"                              — renders branch summary (address, phone, price, occupancy)
 */

import Tabs, { type Tab } from '@/components/ui/Tabs';
import OccupancyPricingTable, { type Room } from '@/components/branch/OccupancyPricingTable';
import AmenitiesGrid, { type Amenity } from '@/components/branch/AmenitiesGrid';
import { formatINR } from '@/lib/utils/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchDetails {
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  startingPrice: number;
  occupancyTypes: string[];
}

interface InfoTabsProps {
  rooms: Room[];
  amenities: Amenity[];
  branch: BranchDetails;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: 'pricing',   label: 'Occupancy & Pricing' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'details',   label: 'Details' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function InfoTabs({ rooms, amenities, branch }: InfoTabsProps) {
  return (
    <Tabs
      tabs={TABS}
      defaultTabId="pricing"
      className="w-full"
      tabListClassName="flex gap-1 border-b border-white/10 mb-6"
      tabClassName="
        relative px-4 py-3 text-sm font-medium text-gray-400
        transition-colors duration-150 rounded-t-md
        hover:text-white
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-[#F5C518]
      "
      activeTabClassName="
        text-white
        after:absolute after:bottom-[-1px] after:left-0 after:right-0
        after:h-[2px] after:bg-[#F5C518] after:rounded-full
      "
      panelClassName="focus-visible:outline-none"
    >
      {(activeTabId) => {
        if (activeTabId === 'pricing') {
          return <OccupancyPricingTable rooms={rooms} />;
        }

        if (activeTabId === 'amenities') {
          return <AmenitiesGrid amenities={amenities} />;
        }

        // activeTabId === 'details'
        return <BranchDetailsPanel branch={branch} />;
      }}
    </Tabs>
  );
}

// ─── Details Panel ────────────────────────────────────────────────────────────

function BranchDetailsPanel({ branch }: { branch: BranchDetails }) {
  const fullAddress = [branch.address, branch.city, branch.state, branch.pincode]
    .filter(Boolean)
    .join(', ');

  return (
    <dl className="space-y-5" aria-label="Branch details">
      {/* Address */}
      <DetailRow
        icon="📍"
        label="Address"
        value={fullAddress}
      />

      {/* Phone numbers */}
      <DetailRow
        icon="📞"
        label="Phone"
        value={
          <ul className="space-y-1" aria-label="Phone numbers">
            {branch.phone.map((number, idx) => (
              <li key={idx}>
                <a
                  href={`tel:${number.replace(/\s+/g, '')}`}
                  className="text-[#F5C518] hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  {number}
                </a>
              </li>
            ))}
          </ul>
        }
      />

      {/* Starting price */}
      <DetailRow
        icon="💰"
        label="Starting Price"
        value={
          <span>
            <span className="text-[#F5C518] font-semibold text-base">
              {formatINR(branch.startingPrice)}
            </span>
            <span className="text-gray-400 text-xs ml-1">/month</span>
          </span>
        }
      />

      {/* Occupancy types */}
      <DetailRow
        icon="🛏️"
        label="Available Occupancy"
        value={
          <ul className="flex flex-wrap gap-2" aria-label="Occupancy types">
            {branch.occupancyTypes.map((type) => (
              <li
                key={type}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/80"
              >
                {type}
              </li>
            ))}
          </ul>
        }
      />
    </dl>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

interface DetailRowProps {
  icon: string;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex gap-3">
      {/* Icon */}
      <span
        className="flex-shrink-0 text-lg w-6 text-center mt-0.5"
        aria-hidden="true"
      >
        {icon}
      </span>

      <div className="flex-1 min-w-0">
        {/* Label */}
        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
          {label}
        </dt>

        {/* Value */}
        <dd className="text-sm text-white/90 leading-relaxed">
          {value}
        </dd>
      </div>
    </div>
  );
}
