import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';

export const metadata: Metadata = {
  title: 'About Us | LN Boys PG & Hostel Jaipur',
  description:
    'Meet the founder of LN Boys PG & Hostel — our story, mission, and commitment to providing safe, comfortable, affordable accommodation for boys in Jaipur near JECRC.',
  openGraph: {
    title: 'About Us | LN Boys PG & Hostel Jaipur',
    description: 'Our story, mission, and commitment to student accommodation in Jaipur.',
    url: `${siteUrl}/about`,
    type: 'website',
  },
};

const STATS = [
  { value: '3', label: 'PG Branches', icon: '🏠' },
  { value: '200+', label: 'Happy Students', icon: '😊' },
  { value: '5+', label: 'Years of Trust', icon: '⭐' },
  { value: '₹7,000', label: 'Starting Price', icon: '💰' },
];

const VALUES = [
  {
    icon: '🍽️',
    title: 'Ghar Jaisa Khaana',
    desc: 'Fresh home-cooked 3 meals daily — breakfast, lunch & dinner. No mess, no compromise.',
  },
  {
    icon: '🔒',
    title: 'Safety First',
    desc: '24×7 CCTV surveillance, security guard, and strict entry/exit policy for total peace of mind.',
  },
  {
    icon: '📶',
    title: 'Always Connected',
    desc: 'High-speed Wi-Fi throughout the premises — study, stream, or attend online classes without interruption.',
  },
  {
    icon: '🛺',
    title: 'Free Auto to JECRC',
    desc: 'Daily free electric auto pickup & drop to JECRC University — morning 8 AM & evening 5:30 PM.',
  },
  {
    icon: '🧹',
    title: 'Clean & Maintained',
    desc: 'Regular housekeeping, pest control, and RO purified water — always fresh and hygienic.',
  },
  {
    icon: '🤝',
    title: 'Community',
    desc: 'A brotherhood of students from across India — study together, grow together.',
  },
];

const TIMELINE = [
  { year: '2019', title: 'PG-I Opens', desc: 'First branch launched near JECRC University, Vidhani — starting with 20 beds.' },
  { year: '2021', title: 'PG-II Launched', desc: 'Second branch opens in Tuwariyan Ki Dhani, Ramchandpura — expanding capacity.' },
  { year: '2023', title: 'Free Auto Service', desc: 'Introduced daily free electric auto to JECRC — a first in the area.' },
  { year: '2024', title: 'PG-III Added', desc: 'Third branch at Sitapura/Kanwarpura — now 3 locations across Jaipur south.' },
  { year: '2025', title: 'Growing Strong', desc: '200+ happy residents, 4.5★ rating, and expanding further.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0B0B3B]">

      {/* ── FOUNDER HERO ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0d45] via-[#0B0B3B] to-[#0B0B3B] border-b border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#F5C518]/5 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#F5C518]/4 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Founder photo */}
            <div className="flex-shrink-0 relative">
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border-4 border-[#F5C518]/40 shadow-2xl shadow-[#F5C518]/10">
                <Image
                  src="/images/founder.jpg"
                  alt="Director & Founder of LN Boys PG & Hostel"
                  fill
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B3B]/60 via-transparent to-transparent" />
              </div>
              {/* Gold ring decoration */}
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full border-2 border-[#F5C518]/30" aria-hidden="true" />
              <div className="absolute -bottom-3 -left-3 w-10 h-10 rounded-full bg-[#F5C518]/20" aria-hidden="true" />
              {/* Founder badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#F5C518] text-[#0B0B3B] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                Founder & Director
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block px-4 py-1 rounded-full bg-[#F5C518]/10 text-[#F5C518] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#F5C518]/20">
                Our Story
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                Built with <span className="text-[#F5C518]">Heart</span>,<br />
                for Every Student
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
                LN Boys PG & Hostel started with one simple promise — <strong className="text-white">give every student a safe, clean,
                homely place to live</strong> while they chase their dreams in Jaipur. No compromises on food,
                security, or comfort.
              </p>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
                What began as a single branch near JECRC University has grown into 3 thriving PG homes
                across South Jaipur — trusted by 200+ students and families every year.
              </p>
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
                <Link
                  href="/#hostels"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F5C518] text-[#0B0B3B] font-bold text-sm hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-[#F5C518]/20"
                >
                  View Our PGs →
                </Link>
                <a
                  href="https://wa.me/918385857902"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
                >
                  💬 WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────── */}
      <section className="border-b border-white/10 py-12 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="text-center p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#F5C518]/30 transition-colors">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5C518]">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-[#F5C518]/10 text-[#F5C518] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#F5C518]/20">Our Mission</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            More Than Just a Room
          </h2>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            We believe where you live shapes how you study. Our mission is to remove every
            daily friction — food, safety, cleanliness, transport — so students can
            focus entirely on their education and growth.
          </p>
        </div>
      </section>

      {/* ── VALUES GRID ────────────────────────────────────────────────── */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            What Makes Us <span className="text-[#F5C518]">Different</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map(v => (
              <div key={v.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#F5C518]/30 hover:bg-[#F5C518]/5 transition-all group">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="text-white font-bold text-base mb-2 group-hover:text-[#F5C518] transition-colors">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JOURNEY TIMELINE ───────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
            Our <span className="text-[#F5C518]">Journey</span>
          </h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#F5C518]/20" aria-hidden="true" />
            <div className="space-y-8">
              {TIMELINE.map((item) => (
                <div key={item.year} className="flex gap-6 items-start">
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-[#F5C518]/10 border-2 border-[#F5C518]/40 flex items-center justify-center z-10">
                    <span className="text-[#F5C518] font-extrabold text-xs">{item.year.slice(2)}</span>
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[#F5C518] font-bold text-xs">{item.year}</span>
                      <h3 className="text-white font-semibold text-base">{item.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to call it <span className="text-[#F5C518]">home?</span>
          </h2>
          <p className="text-gray-400 mb-8">Visit us, take a tour, and see why 200+ students choose LN Boys PG.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F5C518] text-[#0B0B3B] font-bold hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-[#F5C518]/20">
              Contact Us →
            </Link>
            <a href="tel:+918385857902" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 active:scale-95 transition-all">
              📞 +91 83858 57902
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
