'use client';

/**
 * GalleryTabs — Branch Detail Page gallery with category tab filtering.
 *
 * Client Component.
 * Requirements: 3.2, 11.3, 11.4
 *
 * Features:
 * - Tab bar: All, Rooms, Common Area, Food, Exterior
 * - "All" shows every gallery item; other tabs filter by `category` field
 * - Client-side filtering via React state (no extra network requests)
 * - CSS grid: 2 cols on mobile, 3 cols on md, 4 cols on lg+
 * - Next.js <Image> with width, height, alt from gallery items
 * - First row (first 4 images) loaded eagerly; rest lazy-loaded
 * - Empty filtered state: "No photos available for this category yet."
 * - Full keyboard navigation via the reusable Tabs UI component
 */

import Image from 'next/image';
import Tabs from '@/components/ui/Tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GalleryItem {
  _id: string;
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  category: 'room' | 'common-area' | 'food' | 'exterior' | 'event';
  altText: string;
  branchId: string;
  uploadedAt: string;
}

type FilterCategory = 'all' | 'room' | 'common-area' | 'food' | 'exterior';

// ─── Tab configuration ────────────────────────────────────────────────────────

const GALLERY_TABS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'room', label: 'Rooms' },
  { id: 'common-area', label: 'Common Area' },
  { id: 'food', label: 'Food' },
  { id: 'exterior', label: 'Exterior' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface GalleryTabsProps {
  items: GalleryItem[];
}

/**
 * Number of columns in the first grid row (used to determine eager vs lazy loading).
 * Desktop: 4 cols, but we default to the safest (largest) value so first-row
 * images are always eager regardless of viewport.
 */
const EAGER_COUNT = 4;

export default function GalleryTabs({ items }: GalleryTabsProps) {
  return (
    <Tabs
      tabs={GALLERY_TABS}
      defaultTabId="all"
      className="w-full"
      tabListClassName={[
        'flex flex-wrap gap-2 mb-6',
        'border-b border-navy-700',
        'pb-0',
      ].join(' ')}
      tabClassName={[
        // Base tab styles
        'px-4 py-2 text-sm font-medium rounded-t-md',
        'text-white/70 bg-transparent',
        'transition-colors duration-150',
        'hover:text-white hover:bg-navy-700',
        '-mb-px border border-transparent',
        'cursor-pointer',
      ].join(' ')}
      activeTabClassName={[
        // Active tab — gold accent, sits on top of border-b
        '!text-gold border-navy-700 border-b-navy-900 bg-navy-900',
        '!text-[#F5C518]',
      ].join(' ')}
      panelClassName="outline-none"
    >
      {(activeTabId) => {
        const category = activeTabId as FilterCategory;

        // Filter items for the active tab
        const filtered =
          category === 'all'
            ? items
            : items.filter((item) => item.category === category);

        // Empty state
        if (filtered.length === 0) {
          return (
            <div
              className="flex items-center justify-center py-16 px-4 text-center"
              aria-live="polite"
            >
              <p className="text-white/50 text-base italic">
                No photos available for this category yet.
              </p>
            </div>
          );
        }

        // Gallery grid
        return (
          <div
            className={[
              'grid gap-3',
              // 2 cols mobile → 3 cols md → 4 cols lg
              'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
            ].join(' ')}
          >
            {filtered.map((item, index) => {
              // First EAGER_COUNT items are loaded eagerly (above the fold);
              // everything beyond that uses lazy loading.
              const isEager = index < EAGER_COUNT;

              if (item.resourceType === 'video') {
                return (
                  <VideoTile key={item._id} item={item} eager={isEager} />
                );
              }

              return (
                <ImageTile key={item._id} item={item} eager={isEager} />
              );
            })}
          </div>
        );
      }}
    </Tabs>
  );
}

// ─── Image tile ───────────────────────────────────────────────────────────────

interface TileProps {
  item: GalleryItem;
  eager: boolean;
}

function ImageTile({ item, eager }: TileProps) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md bg-navy-800 group">
      <Image
        src={item.url}
        alt={item.altText}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        loading={eager ? 'eager' : 'lazy'}
        // priority is set only for eager images to allow preloading
        priority={eager}
      />
    </div>
  );
}

// ─── Video tile ───────────────────────────────────────────────────────────────

function VideoTile({ item, eager }: TileProps) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md bg-navy-800">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={item.url}
        aria-label={item.altText}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        preload={eager ? 'metadata' : 'none'}
      />
      {/* Play icon overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="text-white/80 bg-black/40 rounded-full p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </div>
  );
}
