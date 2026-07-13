import Link from 'next/link';
import Image from 'next/image';

/**
 * HeroBanner — Full-width hero section for the Home page.
 *
 * Server Component. Displays brand name, tagline, and "Explore Branches" CTA.
 * Requirements: 2.2
 */

const STATS = [
  { value: '2', label: 'PG Branches' },
  { value: '200+', label: 'Happy Residents' },
  { value: '3×', label: 'Meals / Day' },
  { value: '24×7', label: 'CCTV Security' },
];

export default function HeroBanner() {
  return (
    <section
      className="relative w-full min-h-[92vh] flex flex-col justify-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* ── Background image ── */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1600&q=80&auto=format&fit=crop"
          alt="Boys hostel room — comfortable PG accommodation"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          unoptimized
        />
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B3B]/85 via-[#0B0B3B]/75 to-[#0B0B3B]" />
      </div>

      {/* ── Decorative glow ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#F5C518]/8 blur-3xl pointer-events-none" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">

        {/* Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/30 text-[#F5C518] text-xs font-semibold tracking-wide uppercase mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F5C518] animate-pulse" aria-hidden="true" />
          Premium Boys PG in Jaipur
        </span>

        {/* Brand name */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-5 tracking-tight">
          <span className="text-[#F5C518]">LN Boys</span>{' '}
          PG &amp; Hostel
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-4 font-medium">
          Jaipur&apos;s most trusted student accommodation
        </p>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Comfortable, fully furnished rooms for boys near JECRC University &amp; Sanganer.
          3 meals/day · 24×7 CCTV security · High-speed Wi-Fi — starting at{' '}
          <span className="text-[#F5C518] font-semibold">₹7,000/month</span>
          <span className="text-gray-500 text-xs"> (electricity extra @₹11/unit)</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/#hostels"
            className={[
              'inline-block px-8 py-4 rounded-xl font-bold text-base sm:text-lg',
              'bg-[#F5C518] text-[#0B0B3B]',
              'hover:bg-yellow-300 active:scale-95 transition-all duration-200',
              'shadow-lg shadow-[#F5C518]/30',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
            ].join(' ')}
          >
            Choose Your Hostel →
          </Link>
          <Link
            href="/contact"
            className={[
              'inline-block px-8 py-4 rounded-xl font-bold text-base sm:text-lg',
              'bg-white/10 text-white border border-white/25',
              'hover:bg-white/20 active:scale-95 transition-all duration-200',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
            ].join(' ')}
          >
            Contact Us
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-3 backdrop-blur-sm"
            >
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F5C518]">{value}</span>
              <span className="text-xs sm:text-sm text-gray-400 text-center leading-snug">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll chevron ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce" aria-hidden="true">
        <svg className="w-6 h-6 text-[#F5C518]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
