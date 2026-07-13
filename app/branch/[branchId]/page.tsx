/**
 * Branch Detail Page — /branch/[branchId]
 * Premium production-ready design.
 * Uses real GPS coordinates for accurate Google Maps embeds.
 */

import { notFound } from 'next/navigation';
import { type Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import {
  getBranchById,
  type RoomOption,
  type AmenityItem,
  type PolicyItem,
  type LandmarkItem,
  type FoodMenuItem,
  type GalleryMedia,
} from '@/lib/data/branches';
import EnquiryForm from '@/components/forms/EnquiryForm';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ branchId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { branchId } = await params;
  const branch = getBranchById(branchId);
  if (!branch) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';
  const title = `${branch.name} | Best Boys PG in Jaipur | LN Boys PG & Hostel`;
  const description = `Affordable boys PG in Jaipur — ${branch.address}. Rooms from ₹${branch.startingPrice.toLocaleString('en-IN')}/month. 3 meals/day, 24×7 CCTV, Wi-Fi, Free Auto to JECRC.`;
  return {
    title,
    description,
    openGraph: { title, description, url: `${siteUrl}/branch/${branchId}`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// ── Gallery ────────────────────────────────────────────────────────────────
function GallerySection({ gallery }: { gallery: GalleryMedia[] }) {
  if (!gallery.length) return null;
  const images = gallery.filter(g => g.resourceType === 'image');
  const videos = gallery.filter(g => g.resourceType === 'video');

  return (
    <section aria-label="Gallery">
      <SectionHeading icon="📸" title="Photo & Video Gallery" />
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {images.map((item, i) => (
            <a key={item.publicId} href={item.url} target="_blank" rel="noopener noreferrer"
              className="relative block aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-[#F5C518]/50 transition-colors group">
              <Image src={item.url} alt={item.altText} fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                loading={i < 3 ? 'eager' : 'lazy'} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </a>
          ))}
        </div>
      )}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videos.map(item => (
            <div key={item.publicId} className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]">
              <video src={item.url} controls muted playsInline
                className="w-full rounded-t-xl" aria-label={item.altText} />
              <p className="text-gray-400 text-xs px-3 py-2">{item.altText}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Rooms ──────────────────────────────────────────────────────────────────
function RoomsSection({ rooms }: { rooms: RoomOption[] }) {
  const doubles = rooms.filter(r => r.type === 'Double');
  const triples = rooms.filter(r => r.type === 'Triple');

  const variantStyle: Record<string, string> = {
    'AC': 'bg-blue-900/40 text-blue-300 ring-blue-700/40',
    'Cooler': 'bg-cyan-900/40 text-cyan-300 ring-cyan-700/40',
    'Non-AC': 'bg-gray-800/60 text-gray-300 ring-gray-700/40',
  };

  const RoomGroup = ({ title, icon, items }: { title: string; icon: string; items: RoomOption[] }) => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#F5C518] text-lg">{icon}</span>
        <h4 className="text-white font-semibold text-sm uppercase tracking-wider">{title}</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map(room => (
          <div key={`${room.type}-${room.variant}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#F5C518]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${variantStyle[room.variant] ?? 'bg-white/10 text-gray-300 ring-white/10'}`}>
                {room.variant}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 ring-1 ring-green-700/40">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Available
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[#F5C518] font-bold text-2xl">₹{room.pricePerMonth.toLocaleString('en-IN')}</span>
              <span className="text-gray-400 text-xs">/month</span>
            </div>
            <p className="text-green-400 text-xs font-medium">✓ Includes 3 meals/day</p>
            <p className="text-gray-500 text-xs mt-0.5">+ Electricity @₹11/unit extra</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <SectionHeading icon="🛏️" title="Room Types & Pricing" />
      <div className="rounded-xl border border-[#F5C518]/30 bg-[#F5C518]/5 p-4 flex gap-3">
        <span className="text-xl shrink-0">ℹ️</span>
        <div>
          <p className="text-white font-semibold text-sm mb-1">What&apos;s included in rent?</p>
          <p className="text-gray-300 text-xs leading-relaxed">
            Room rent <strong className="text-white">includes 3 meals/day</strong> (breakfast, lunch &amp; dinner).
            {' '}<span className="text-[#F5C518] font-semibold">Electricity bill is charged separately</span> — ₹11 per unit, billed monthly based on actual consumption.
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500">*Starting rates. Final price may vary by room selection.</p>
      {doubles.length > 0 && <RoomGroup title="2-Seater (Double Occupancy)" icon="👥" items={doubles} />}
      {triples.length > 0 && <RoomGroup title="3-Seater (Triple Occupancy)" icon="👥" items={triples} />}
    </section>
  );
}

// ── Amenities ──────────────────────────────────────────────────────────────
function AmenitiesSection({ amenities }: { amenities: AmenityItem[] }) {
  const categoryConfig: Record<string, { label: string; color: string }> = {
    basic: { label: 'Basic Facilities', color: 'text-blue-400' },
    safety: { label: 'Safety & Security', color: 'text-red-400' },
    comfort: { label: 'Comfort & Lifestyle', color: 'text-purple-400' },
    food: { label: 'Food & Dining', color: 'text-orange-400' },
  };
  const grouped = amenities.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<string, AmenityItem[]>);

  return (
    <section className="space-y-5">
      <SectionHeading icon="✨" title="Amenities & Services" />
      {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map(cat => {
        const items = grouped[cat];
        if (!items?.length) return null;
        return (
          <div key={cat}>
            <h4 className={`text-sm font-semibold mb-3 ${categoryConfig[cat].color}`}>{categoryConfig[cat].label}</h4>
            <div className="flex flex-wrap gap-2">
              {items.map(a => (
                <span key={a.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-gray-300 ring-1 ring-white/10 hover:ring-[#F5C518]/30 transition-colors">
                  <span>{a.icon}</span> {a.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ── Policies ───────────────────────────────────────────────────────────────
function PoliciesSection({ policies }: { policies: PolicyItem[] }) {
  return (
    <section className="space-y-3">
      <SectionHeading icon="📋" title="House Rules & Policies" />
      <div className="space-y-2">
        {policies.sort((a, b) => a.order - b.order).map(p => (
          <details key={p.title} className="group rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-colors">
            <summary className="flex items-center justify-between cursor-pointer p-4 text-white font-medium text-sm select-none">
              {p.title}
              <span className="text-[#F5C518] text-base group-open:rotate-180 transition-transform duration-200">▾</span>
            </summary>
            <p className="px-4 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-3">{p.body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ── Landmarks ──────────────────────────────────────────────────────────────
function LandmarksNearby({ landmarks }: { landmarks: LandmarkItem[] }) {
  if (!landmarks.length) return null;
  const categoryIcon: Record<string, string> = {
    college: '🎓', hospital: '🏥', transport: '🚌', other: '📍',
  };

  const landmarkIcon = (name: string, cat: string) => {
    if (cat === 'hospital') return '🏥';
    if (cat === 'college') return '🎓';
    if (cat === 'transport') {
      if (name.toLowerCase().includes('airport')) return '✈️';
      return '🚌';
    }
    // 'other' — detect by name
    if (name.toLowerCase().includes('mall') || name.toLowerCase().includes('market')) return '🛍️';
    if (name.toLowerCase().includes('temple') || name.toLowerCase().includes('mandir')) return '🛕';
    return '📍';
  };
  const categoryOrder = ['college', 'hospital', 'transport', 'other'];
  const grouped = landmarks.reduce((acc, l) => {
    if (!acc[l.category]) acc[l.category] = [];
    acc[l.category].push(l);
    return acc;
  }, {} as Record<string, LandmarkItem[]>);

  const categoryLabel: Record<string, string> = {
    college: 'Colleges & Universities',
    hospital: 'Hospitals & Healthcare',
    transport: 'Transport & Connectivity',
    other: 'Shopping, Temples & More',
  };

  const fmtDist = (m: number) => m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;

  return (
    <section className="space-y-6">
      <SectionHeading icon="📍" title="Nearby Places" />
      {categoryOrder.map(cat => {
        const items = grouped[cat];
        if (!items?.length) return null;
        return (
          <div key={cat}>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <span>{categoryIcon[cat]}</span>{categoryLabel[cat]}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(l => (
                <a key={l.name} href={l.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#F5C518]/40 hover:bg-[#F5C518]/5 transition-all group">
                  <span className="text-xl shrink-0">{landmarkIcon(l.name, l.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{l.name}</p>
                    <p className="text-[#F5C518] text-xs font-semibold">{fmtDist(l.distanceMetres)} away</p>
                  </div>
                  <span className="text-gray-500 group-hover:text-[#F5C518] text-xs transition-colors shrink-0">Directions →</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ── Food Menu ──────────────────────────────────────────────────────────────
function FoodMenuSection({ foodMenu }: { foodMenu: FoodMenuItem[] }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals: FoodMenuItem['meal'][] = ['breakfast', 'lunch', 'dinner'];
  const mealLabel = { breakfast: '☕ Breakfast', lunch: '🍱 Lunch', dinner: '🌙 Dinner' };
  const dayShort = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

  return (
    <section>
      <SectionHeading icon="🍽️" title="Weekly Food Menu" />
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-3 py-3 text-left text-gray-400 font-medium text-xs w-16">Day</th>
              {meals.map(m => (
                <th key={m} className="px-3 py-3 text-left text-[#F5C518] font-medium text-xs">{mealLabel[m]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr key={day} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                <td className="px-3 py-2.5 text-white font-semibold text-xs">{dayShort[day as keyof typeof dayShort]}</td>
                {meals.map(meal => {
                  const entry = foodMenu.find(f => f.day === day && f.meal === meal);
                  return (
                    <td key={meal} className="px-3 py-2.5 text-gray-300 text-xs align-top leading-relaxed">
                      {entry ? entry.items.join(', ') : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-gray-500 text-xs mt-2">*Menu may vary based on availability.</p>
    </section>
  );
}

// ── Map ────────────────────────────────────────────────────────────────────
function MapSection({
  name, mapEmbedUrl, googleMapsUrl, address,
}: {
  name: string;
  mapEmbedUrl: string;
  googleMapsUrl: string;
  address: string;
}) {
  return (
    <section>
      <SectionHeading icon="🗺️" title="Location on Map" />
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        {/* Map embed */}
        <div className="h-72 sm:h-96 w-full bg-white/5">
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Location map of ${name}`}
            className="w-full h-full"
          />
        </div>
        {/* Address bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-4 bg-white/[0.03] border-t border-white/10">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-[#F5C518] mt-0.5 shrink-0">📍</span>
            <p className="text-sm text-gray-300 leading-relaxed">{address}</p>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5C518] text-[#0B0B3B] text-sm font-bold hover:bg-yellow-300 active:scale-95 transition-all shrink-0 shadow-lg shadow-[#F5C518]/20"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
            </svg>
            Get Directions
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Shared heading ─────────────────────────────────────────────────────────
function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-[#F5C518]/15 border border-[#F5C518]/30 flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
      <h3 className="text-white font-bold text-xl">{title}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function BranchDetailPage({ params }: PageProps) {
  const { branchId } = await params;
  const branch = getBranchById(branchId);
  if (!branch) notFound();

  const pgLabel = { I: 'PG-I', II: 'PG-II', III: 'PG-III' }[branch.pgNumber];

  return (
    <div className="min-h-screen bg-[#0B0B3B]">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0d0d45] via-[#0B0B3B] to-[#0B0B3B] border-b border-white/10 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#F5C518]/6 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#F5C518]/4 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
            <Link href="/" className="text-gray-500 hover:text-[#F5C518] transition-colors">Home</Link>
            <span className="text-gray-700">/</span>
            <span className="text-white font-medium truncate">{branch.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end gap-6 justify-between">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#F5C518] text-[#0B0B3B] font-extrabold text-sm shadow-lg">
                  {branch.pgNumber}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-900/60 text-green-300 ring-1 ring-green-700/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Active — Rooms Available
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20">
                  {pgLabel} · South Jaipur
                </span>
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 leading-tight">
                {branch.name}
              </h1>

              {/* Address */}
              <p className="text-gray-400 text-sm mb-5 max-w-xl flex items-start gap-2">
                <span className="text-[#F5C518] shrink-0 mt-0.5">📍</span>
                {branch.address}, {branch.state} — {branch.pincode}
              </p>

              {/* Quick stats chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: '⭐', text: `${branch.rating.toFixed(1)}/5 Rating` },
                  { icon: '💰', text: `From ₹${branch.startingPrice.toLocaleString('en-IN')}/mo` },
                  { icon: '🍽️', text: '3 Meals/Day' },
                  { icon: '📶', text: 'High-Speed Wi-Fi' },
                  { icon: '📷', text: '24×7 CCTV' },
                  { icon: '🛺', text: 'Free Auto to JECRC' },
                ].map(chip => (
                  <span key={chip.text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-gray-300 border border-white/10">
                    {chip.icon} {chip.text}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <a href={`tel:${branch.phone[0].replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 active:scale-95 transition-all border border-white/10">
                📞 Call
              </a>
              <a href={`https://wa.me/${branch.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F5C518] text-[#0B0B3B] text-sm font-bold hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-[#F5C518]/20">
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="lg:flex gap-10">

          {/* Left — main content */}
          <main className="flex-1 min-w-0 space-y-14">
            <GallerySection gallery={branch.gallery} />
            <RoomsSection rooms={branch.rooms} />
            <AmenitiesSection amenities={branch.amenities} />
            <LandmarksNearby landmarks={branch.landmarks} />
            <MapSection
              name={branch.name}
              mapEmbedUrl={branch.mapEmbedUrl}
              googleMapsUrl={branch.googleMapsUrl}
              address={`${branch.address}, ${branch.city}, ${branch.state} ${branch.pincode}`}
            />
            <FoodMenuSection foodMenu={branch.foodMenu} />
            <PoliciesSection policies={branch.policies} />

            {/* Mobile enquiry form */}
            <div className="lg:hidden">
              <SectionHeading icon="📝" title="Book Your Spot" />
              <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <EnquiryForm branchId={branch.branchId} />
                <p className="text-xs text-gray-500 text-center mt-4">Free cancellation · No payment required now</p>
              </div>
            </div>
          </main>

          {/* Right — sticky enquiry sidebar (desktop only) */}
          <aside className="hidden lg:block w-80 flex-shrink-0" aria-label="Enquiry sidebar">
            <div className="sticky top-6 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d0d45]">
              <div className="px-6 py-5 border-b border-white/10 bg-[#F5C518]/8">
                <h2 className="text-xl font-bold text-white">Book Your Spot</h2>
                <p className="mt-1 text-sm text-[#F5C518]">Schedule a visit or reserve your room</p>
              </div>
              <div className="px-6 py-6">
                <EnquiryForm branchId={branch.branchId} />
              </div>
              <div className="px-6 pb-5">
                <p className="text-xs text-gray-400 text-center">Free cancellation · No payment required now</p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
