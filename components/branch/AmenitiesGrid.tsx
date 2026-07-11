/**
 * AmenitiesGrid — Displays branch amenities grouped by category.
 *
 * Server Component (no 'use client' needed).
 * Requirements: 3.3
 *
 * Renders four potential category groups: basic, safety, comfort, food.
 * Each group has a heading and a responsive 2–3 column grid of amenity items.
 * Each amenity item shows the icon (emoji or icon string) alongside the name.
 * - Groups with zero amenities are skipped entirely.
 * - If no amenities at all, an empty state is shown.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Amenity {
  _id: string;
  branchId: string;
  name: string;   // e.g. "High-Speed Wi-Fi"
  icon: string;   // e.g. "📶" or "wifi" — treated as a display string
  category: 'basic' | 'safety' | 'comfort' | 'food';
}

interface AmenitiesGridProps {
  amenities: Amenity[];
}

// ─── Category configuration ───────────────────────────────────────────────────

type AmenityCategory = Amenity['category'];

interface CategoryConfig {
  label: string;
  /** Decorative accent icon shown next to the section heading */
  headingIcon: string;
}

const CATEGORY_CONFIG: Record<AmenityCategory, CategoryConfig> = {
  basic:   { label: 'Basic Amenities',       headingIcon: '🏠' },
  safety:  { label: 'Safety & Security',     headingIcon: '🔒' },
  comfort: { label: 'Comfort & Lifestyle',   headingIcon: '✨' },
  food:    { label: 'Food & Kitchen',        headingIcon: '🍽️' },
};

/** Canonical display order of categories */
const CATEGORY_ORDER: AmenityCategory[] = ['basic', 'safety', 'comfort', 'food'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  // Group amenities by category
  const grouped = new Map<AmenityCategory, Amenity[]>();
  for (const amenity of amenities) {
    const existing = grouped.get(amenity.category) ?? [];
    grouped.set(amenity.category, [...existing, amenity]);
  }

  // Determine which categories have at least one amenity (preserving display order)
  const activeCategories = CATEGORY_ORDER.filter((cat) => (grouped.get(cat)?.length ?? 0) > 0);

  // Empty state — no amenities at all
  if (activeCategories.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-white/10 bg-white/5"
        role="status"
        aria-label="No amenities available"
      >
        <span className="text-4xl mb-3" aria-hidden="true">
          🏷️
        </span>
        <p className="text-gray-400 text-sm text-center">
          Amenities information is not yet available for this branch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activeCategories.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const items = grouped.get(category)!;

        return (
          <section key={category} aria-labelledby={`amenities-${category}`}>
            {/* Category heading */}
            <h3
              id={`amenities-${category}`}
              className="flex items-center gap-2 text-base font-semibold text-white mb-4"
            >
              <span aria-hidden="true">{config.headingIcon}</span>
              {config.label}
            </h3>

            {/* Amenity items grid — 2 cols mobile → 3 cols md+ */}
            <ul
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
              aria-label={config.label}
            >
              {items.map((amenity) => (
                <AmenityItem key={amenity._id} amenity={amenity} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ─── Amenity Item ─────────────────────────────────────────────────────────────

function AmenityItem({ amenity }: { amenity: Amenity }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-150">
      {/* Icon — rendered as text (emoji or short string) */}
      <span
        className="flex-shrink-0 text-xl leading-none w-6 text-center"
        aria-hidden="true"
        title={amenity.name}
      >
        {amenity.icon}
      </span>

      {/* Amenity name */}
      <span className="text-sm text-white/90 leading-tight">
        {amenity.name}
      </span>
    </li>
  );
}
