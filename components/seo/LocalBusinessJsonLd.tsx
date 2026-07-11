/**
 * LocalBusinessJsonLd — Renders LocalBusiness JSON-LD for Home and Contact pages.
 *
 * Server Component.
 * Requirements: 10.9
 *
 * name, address, and telephone values are sourced from the branch document
 * (not hardcoded), ensuring JSON-LD stays consistent with the DB.
 *
 * telephone is derived from phone[0] of the branch document internally —
 * callers pass the full phone array.
 */

interface LocalBusinessJsonLdProps {
  /** Branch name — sourced from branches.name */
  name: string;
  /** Street address — sourced from branches.address */
  address: string;
  /** City — sourced from branches.city */
  city: string;
  /** State — sourced from branches.state */
  state: string;
  /** 6-digit pincode — sourced from branches.pincode */
  pincode: string;
  /** Phone array from branch document; telephone uses phone[0] */
  phone: string[];
  /** WhatsApp number from branch document */
  whatsapp: string;
  /** Canonical URL for this business (defaults to NEXT_PUBLIC_SITE_URL) */
  url?: string;
  /** Optional latitude for geo coordinates */
  latitude?: number | null;
  /** Optional longitude for geo coordinates */
  longitude?: number | null;
}

export default function LocalBusinessJsonLd({
  name,
  address,
  city,
  state,
  pincode,
  phone,
  whatsapp,
  url,
  latitude,
  longitude,
}: LocalBusinessJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';

  // telephone sourced from phone[0] per design spec
  const telephone = phone[0] ?? '';

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: city,
      addressRegion: state,
      postalCode: pincode,
      addressCountry: 'IN',
    },
    telephone,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: whatsapp,
      contactType: 'customer service',
    },
    url: url ?? siteUrl,
  };

  // Include geo coordinates only when both values are provided and non-null
  if (latitude != null && longitude != null) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude,
      longitude,
    };
  }

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
