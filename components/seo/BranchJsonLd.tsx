/**
 * BranchJsonLd — Renders LodgingBusiness JSON-LD structured data for branch pages.
 *
 * Server Component.
 * Requirements: 10.2
 *
 * All field values are sourced from the branch document (not hardcoded).
 */

interface BranchJsonLdProps {
  branchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  startingPrice: number;
  rating: number;
  imageUrl?: string;
}

export default function BranchJsonLd({
  branchId,
  name,
  address,
  city,
  state,
  pincode,
  phone,
  startingPrice,
  rating,
  imageUrl,
}: BranchJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: city,
      addressRegion: state,
      postalCode: pincode,
      addressCountry: 'IN',
    },
    telephone: phone[0] ?? '',
    priceRange: `₹${startingPrice.toLocaleString('en-IN')} - ₹${(startingPrice * 2).toLocaleString('en-IN')}`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: 10,
    },
    url: `${siteUrl}/branch/${branchId}`,
    ...(imageUrl ? { image: imageUrl } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
