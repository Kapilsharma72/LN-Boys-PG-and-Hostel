/**
 * LandmarksSection — Displays nearby landmarks for a branch, grouped by category.
 *
 * Server Component (no 'use client' needed).
 * Requirements: 3.7
 *
 * Groups landmarks by category in order: college → hospital → transport → other.
 * Each category shows a heading and a list of landmarks with name, distance, and
 * a "Get Directions" deep-link using the `googleMapsUrl` field.
 * - Categories with zero landmarks are skipped entirely.
 * - When zero landmarks at all: shows "Nearby places information coming soon."
 *
 * Distance formatting:
 * - < 1000 m  → "Xm"        (e.g. "500m")
 * - ≥ 1000 m  → "X.Xkm"    (e.g. "1.2km")
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Landmark {
  _id: string;
  branchId: string;
  name: string;
  category: 'college' | 'hospital' | 'transport' | 'other';
  distanceMetres: number;
  googleMapsUrl: string;
}

interface LandmarksSectionProps {
  landmarks: Landmark[];
}

// ─── Category configuration ───────────────────────────────────────────────────

type LandmarkCategory = Landmark['category'];

interface CategoryConfig {
  label: string;
  /** Decorative icon shown next to the section heading */
  headingIcon: string;
}

const CATEGORY_CONFIG: Record<LandmarkCategory, CategoryConfig> = {
  college:   { label: 'Colleges & Universities',  headingIcon: '🎓' },
  hospital:  { label: 'Hospitals & Healthcare',   headingIcon: '🏥' },
  transport: { label: 'Transport & Connectivity', headingIcon: '🚌' },
  other:     { label: 'Other Nearby Places',      headingIcon: '📍' },
};

/** Canonical display order of categories */
const CATEGORY_ORDER: LandmarkCategory[] = ['college', 'hospital', 'transport', 'other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a distance in metres to a human-readable string.
 * - < 1000 m  → "Xm"     (e.g. "500m")
 * - ≥ 1000 m  → "X.Xkm"  (e.g. "1.2km")
 */
export function formatDistance(metres: number): string {
  if (metres < 1000) {
    return `${metres}m`;
  }
  const km = metres / 1000;
  return `${km.toFixed(1)}km`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandmarksSection({ landmarks }: LandmarksSectionProps) {
  // Empty state — no landmarks at all
  if (landmarks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-white/10 bg-white/5"
        role="status"
        aria-label="No nearby landmarks available"
      >
        <span className="text-4xl mb-3" aria-hidden="true">
          📍
        </span>
        <p className="text-gray-400 text-sm text-center">
          Nearby places information coming soon.
        </p>
      </div>
    );
  }

  // Group landmarks by category
  const grouped = new Map<LandmarkCategory, Landmark[]>();
  for (const landmark of landmarks) {
    const existing = grouped.get(landmark.category) ?? [];
    grouped.set(landmark.category, [...existing, landmark]);
  }

  // Determine which categories have at least one landmark (preserving display order)
  const activeCategories = CATEGORY_ORDER.filter(
    (cat) => (grouped.get(cat)?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-8">
      {activeCategories.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const items = grouped.get(category)!;

        return (
          <section key={category} aria-labelledby={`landmarks-${category}`}>
            {/* Category heading */}
            <h3
              id={`landmarks-${category}`}
              className="flex items-center gap-2 text-base font-semibold text-white mb-4"
            >
              <span aria-hidden="true">{config.headingIcon}</span>
              {config.label}
            </h3>

            {/* Landmark list */}
            <ul className="space-y-2" aria-label={config.label}>
              {items.map((landmark) => (
                <LandmarkItem key={landmark._id} landmark={landmark} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ─── Landmark Item ────────────────────────────────────────────────────────────

function LandmarkItem({ landmark }: { landmark: Landmark }) {
  const { name, distanceMetres, googleMapsUrl } = landmark;
  const formattedDistance = formatDistance(distanceMetres);

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors duration-150">
      {/* Name + distance */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Distance badge */}
        <span
          className="flex-shrink-0 text-xs font-medium text-[#F5C518] bg-[#F5C518]/10 border border-[#F5C518]/20 rounded-full px-2.5 py-0.5 tabular-nums"
          aria-label={`Distance: ${formattedDistance}`}
        >
          {formattedDistance}
        </span>

        {/* Landmark name */}
        <span className="text-sm text-white/90 truncate">{name}</span>
      </div>

      {/* Get Directions link */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-xs font-medium text-[#F5C518] hover:text-white hover:bg-[#F5C518] border border-[#F5C518]/50 hover:border-[#F5C518] rounded-md px-3 py-1.5 transition-colors duration-150 whitespace-nowrap"
        aria-label={`Get directions to ${name}`}
      >
        Get Directions
      </a>
    </li>
  );
}
