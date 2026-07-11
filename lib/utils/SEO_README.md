# SEO Utilities Documentation

This directory contains helper functions for generating SEO-compliant page titles and metadata following the design specifications from the LN Boys PG & Hostel website design document.

## Files

- **`seo.ts`** - Core SEO utility functions
- **`seo.test.ts`** - Comprehensive unit tests
- **`seo.example.ts`** - Usage examples for Next.js pages

## Functions

### `generateBranchTitle(branch, landmark)`

Generates the title for a Branch Detail Page following the pattern specified in **Requirement 10.1**:

```
[Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel
```

**Parameters:**
- `branch` (BranchForSEO) - Branch object containing `name` and `city`
- `landmark` (string) - Nearby landmark name (e.g., "JECRC")

**Returns:** Formatted title string

**Example:**
```typescript
const title = generateBranchTitle(
  { name: 'LN Boys PG - Vidhani', city: 'Jaipur', ... },
  'JECRC'
);
// Result: "LN Boys PG - Vidhani | Best Boys PG near JECRC, Jaipur | LN Boys PG & Hostel"
```

---

### `generatePageMeta(pageType, options)`

Generates complete Next.js Metadata object for different page types, including:
- Page title following design patterns
- Meta description
- Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)

**Page Type Patterns:**

| Page Type | Title Pattern |
|-----------|---------------|
| `home` | `Best Boys PG & Hostel in Jaipur \| LN Boys PG & Hostel` |
| `branch` | `[Branch Name] \| Best Boys PG near [Landmark], [City] \| LN Boys PG & Hostel` |
| `locations` | `All PG & Hostel Locations in Jaipur \| LN Boys PG & Hostel` |
| `about` | `About Us \| LN Boys PG & Hostel, Jaipur` |
| `contact` | `Contact Us \| LN Boys PG & Hostel, Jaipur` |
| `blog` | `PG Guide & Local Tips \| LN Boys PG & Hostel Blog` |
| `post` | `[post.metaTitle]` |

**Parameters:**
- `pageType` - One of: 'home', 'locations', 'about', 'contact', 'blog', 'branch', 'post'
- `options` (optional) - Additional data:
  - `branch` - Required for 'branch' page type
  - `landmark` - Required for 'branch' page type
  - `post` - Required for 'post' page type
  - `description` - Optional custom description
  - `imageUrl` - Optional custom OG image
  - `url` - Optional custom canonical URL

**Returns:** Next.js `Metadata` object

**Example:**
```typescript
// Home page
export async function generateMetadata() {
  return generatePageMeta('home');
}

// Branch page
export async function generateMetadata({ params }: Props) {
  const branch = await getBranch(params.branchId);
  return generatePageMeta('branch', {
    branch: {
      branchId: branch.branchId,
      name: branch.name,
      city: branch.city,
      metaDescription: branch.metaDescription,
      startingPrice: branch.startingPrice,
      heroImageUrl: branch.heroImageUrl,
    },
    landmark: 'JECRC',
  });
}
```

---

### `generateHeroAlt(branchName)`

Generates alt text for branch hero images.

**Pattern:** `Hero image for [branchName]`

**Example:**
```typescript
const alt = generateHeroAlt('LN Boys PG - Vidhani');
// Result: "Hero image for LN Boys PG - Vidhani"
```

---

### `generateTrustIconAlt(iconType)`

Generates descriptive alt text for trust strip icons on the home page.

**Icon Types:**
- `meals` → "3 meals per day included icon"
- `security` → "24x7 CCTV security surveillance icon"
- `wifi` → "High-speed Wi-Fi internet icon"
- `pricing` → "Affordable starting price icon"

**Example:**
```typescript
const alt = generateTrustIconAlt('security');
// Result: "24x7 CCTV security surveillance icon"
```

---

## Requirements Validation

These utilities validate the following requirements:

- **Requirement 10.1**: Branch Detail Page title pattern
- **Requirement 10.3**: Open Graph meta tags on every public page
- **Requirement 10.4**: Twitter Card meta tags on every public page
- **Requirement 10.7**: Non-empty alt attributes (minimum 3 characters)

## TypeScript Interfaces

### `BranchForSEO`

Minimal branch fields needed for SEO:

```typescript
interface BranchForSEO {
  branchId: string;
  name: string;
  city: string;
  metaDescription?: string | null;
  startingPrice: number;
  heroImageUrl?: string | null;
}
```

### `PostForSEO`

Minimal post fields needed for SEO:

```typescript
interface PostForSEO {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  heroImageUrl?: string | null;
}
```

## Testing

Run unit tests with:

```bash
npm run test seo.test.ts
# or
vitest lib/utils/seo.test.ts
```

Tests cover:
- Title pattern compliance for all page types
- Open Graph and Twitter Card tag inclusion
- Fallback behavior for optional fields
- Error handling for missing required parameters
- Alt text generation (minimum 3 characters)
- Custom overrides for descriptions and images

## Integration with Next.js 14

These utilities are designed for the Next.js 14 App Router Metadata API:

```typescript
// app/branch/[branchId]/page.tsx
import { generatePageMeta } from '@/lib/utils/seo';
import { getBranch } from '@/lib/db/queries';

export async function generateMetadata({ params }: Props) {
  const branch = await getBranch(params.branchId);
  return generatePageMeta('branch', {
    branch,
    landmark: 'JECRC',
  });
}
```

## Notes

- All metadata includes **both** Open Graph and Twitter Card tags for maximum social media compatibility
- Default OG image is `/og-default.jpg` (must be placed in `public/` directory)
- Site URL is hardcoded as `https://lnboyspg.in` (production domain)
- All alt text is guaranteed to be at least 3 characters (per Requirement 10.7)
- Functions throw errors when required parameters are missing (fail-fast behavior)
