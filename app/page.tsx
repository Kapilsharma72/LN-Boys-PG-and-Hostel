import HeroBanner from '@/components/home/HeroBanner';
import TrustStrip from '@/components/home/TrustStrip';
import PgImageCard from '@/components/home/PgImageCard';
import AutoServiceBanner from '@/components/home/AutoServiceBanner';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FaqSection from '@/components/home/FaqSection';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';

export const metadata: Metadata = {
  title: 'LN Boys PG & Hostel | Best Boys PG in Jaipur near JECRC',
  description: 'Premium boys PG accommodation in Jaipur near JECRC University. 3 meals/day, 24×7 CCTV, high-speed Wi-Fi, free auto service. Starting ₹7,000/month.',
  openGraph: {
    title: 'LN Boys PG & Hostel | Best Boys PG in Jaipur near JECRC',
    description: 'Premium boys PG near JECRC University Jaipur. 3 meals/day, CCTV, Wi-Fi. Starting ₹7,000/month.',
    url: siteUrl,
    type: 'website',
  },
};

const PGS = [
  {
    branchId: 'ln-vidhani-jecrc',
    pgNumber: 'I' as const,
    name: 'LN Boys PG & Hostel - I',
    address: 'Plot No. 14, Vidhani, Near JECRC University, Jaipur',
    startingPrice: 7000,
    status: 'active' as const,
    roomTypesLabel: '2 & 3 Seater • AC / Cooler / Non-AC',
  },
  {
    branchId: 'ln-sanganer-ii',
    pgNumber: 'II' as const,
    name: 'LN Boys PG & Hostel - II',
    address: 'Tuwariyan Ki Dhani, Ramchandpura, Near JECRC, Jaipur',
    startingPrice: 7000,
    status: 'active' as const,
    roomTypesLabel: '2 & 3 Seater • AC / Cooler / Non-AC',
  },
  {
    branchId: 'ln-sitapura-iii',
    pgNumber: 'III' as const,
    name: 'LN Boys PG & Hostel - III',
    address: 'Sitapura, Rampura at Kanwarpura, Jaipur — 302022',
    startingPrice: 7000,
    status: 'active' as const,
    roomTypesLabel: '2 & 3 Seater • AC / Cooler / Non-AC',
  },
];

export default function HomePage() {
  return (
    <>
      <HeroBanner />

      {/* ── PG Cards ──────────────────────────────────────────────────── */}
      <section id="hostels" className="w-full bg-[#0B0B3B] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-[#F5C518]/10 text-[#F5C518] text-xs font-semibold uppercase tracking-wider mb-3 border border-[#F5C518]/20">
              3 Locations in Jaipur
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Choose Your <span className="text-[#F5C518]">Hostel Block</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
              All 3 branches near JECRC University — fully furnished, meals included, free auto service.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PGS.map(pg => (
              <PgImageCard key={pg.branchId} {...pg} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Auto Service ──────────────────────────────────────────────── */}
      <AutoServiceBanner />

      {/* ── Trust Strip ───────────────────────────────────────────────── */}
      <TrustStrip />

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-[#0d0d45] to-[#0B0B3B] border-t border-white/10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/20 text-[#F5C518] text-xs font-semibold uppercase tracking-wide mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5C518] animate-pulse" />
            Rooms Available Now
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Move In?
          </h2>
          <p className="text-gray-400 text-base mb-10 max-w-xl mx-auto">
            Schedule a free visit today — see the rooms, meet the team, and lock in your spot before it fills up.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#F5C518] text-[#0B0B3B] font-bold text-base hover:bg-yellow-300 active:scale-95 transition-all shadow-xl shadow-[#F5C518]/20">
              Book a Free Visit →
            </Link>
            <a href="https://wa.me/918385857902?text=Hi, I want to visit LN Boys PG. Can you help?"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-base border border-white/20 hover:bg-white/20 active:scale-95 transition-all">
              💬 Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
