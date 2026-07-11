import ContactForm from '@/components/forms/ContactForm';
import LocalBusinessJsonLd from '@/components/seo/LocalBusinessJsonLd';
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.in';

export const metadata: Metadata = {
  title: 'Contact Us | LN Boys PG & Hostel Jaipur',
  description: 'Get in touch with LN Boys PG & Hostel. Call, WhatsApp or visit us at any of our 3 branches in Jaipur.',
  openGraph: {
    title: 'Contact Us | LN Boys PG & Hostel Jaipur',
    description: 'Call, WhatsApp or visit LN Boys PG & Hostel — 3 branches in Jaipur.',
    url: `${siteUrl}/contact`,
    type: 'website',
  },
};

const BRANCHES = [
  {
    branchId: 'ln-vidhani-jecrc',
    pgNumber: 'I',
    name: 'LN Boys PG & Hostel — I',
    tag: 'Main Office',
    address: 'Plot No. 14, Vidhani, Near JECRC University, Ramchandpura, Jaipur — 302022',
    landmark: 'Opposite JECRC University Gate',
    phone: '+91 83858 57902',
    whatsapp: '918385857902',
    googleMapsUrl: 'https://maps.app.goo.gl/BU2LhoBSQsEEzdSP8',
  },
  {
    branchId: 'ln-sanganer-ii',
    pgNumber: 'II',
    name: 'LN Boys PG & Hostel — II',
    tag: 'Near JECRC',
    address: 'Tuwariyan Ki Dhani, Ramchandpura, Near JECRC University, Jaipur — 302022',
    landmark: '~400m from JECRC Main Gate',
    phone: '+91 83858 57902',
    whatsapp: '918385857902',
    googleMapsUrl: 'https://maps.app.goo.gl/d1kXy3JChZiqjhey7',
  },
  {
    branchId: 'ln-sitapura-iii',
    pgNumber: 'III',
    name: 'LN Boys PG & Hostel — III',
    tag: 'Sitapura',
    address: 'Sitapura, Rampura at Kanwarpura, Jaipur — 302022',
    landmark: 'Near MGH Hospital & Sitapura Puliya',
    phone: '+91 83858 57902',
    whatsapp: '918385857902',
    googleMapsUrl: 'https://maps.app.goo.gl/ZQrCgLx8UFuT4C7dA',
  },
];

const CONTACT_WAYS = [
  {
    icon: '📞',
    label: 'Call Us',
    value: '+91 83858 57902',
    href: 'tel:+918385857902',
    cta: 'Call Now',
    color: 'bg-blue-900/30 border-blue-700/30',
  },
  {
    icon: '💬',
    label: 'WhatsApp',
    value: 'Chat directly — fast reply',
    href: 'https://wa.me/918385857902',
    cta: 'Open WhatsApp',
    color: 'bg-green-900/30 border-green-700/30',
  },
  {
    icon: '🕐',
    label: 'Visiting Hours',
    value: '10 AM – 8 PM, All Days',
    href: null,
    cta: null,
    color: 'bg-[#F5C518]/10 border-[#F5C518]/20',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0B0B3B]">

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0d0d45] via-[#0B0B3B] to-[#0B0B3B] border-b border-white/10 py-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F5C518]/5 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1 rounded-full bg-[#F5C518]/10 text-[#F5C518] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#F5C518]/20">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            We&apos;re Happy to <span className="text-[#F5C518]">Help</span>
          </h1>
          <p className="text-gray-400 text-base">
            Visit any of our 3 branches, call us, or drop a message — we respond fast.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── QUICK CONTACT WAYS ──────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CONTACT_WAYS.map(w => (
              <div key={w.label} className={`rounded-2xl border p-6 ${w.color} flex flex-col gap-3`}>
                <span className="text-3xl">{w.icon}</span>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{w.label}</p>
                  <p className="text-white font-bold text-sm">{w.value}</p>
                </div>
                {w.href && w.cta && (
                  <a href={w.href} target={w.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-[#F5C518] hover:underline">
                    {w.cta} →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 3 BRANCH LOCATION CARDS ─────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="text-[#F5C518]">📍</span> Our 3 Locations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BRANCHES.map(b => (
              <div key={b.branchId}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#F5C518]/40 hover:bg-[#F5C518]/5 transition-all flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F5C518] text-[#0B0B3B] font-extrabold text-sm shadow-md">
                    {b.pgNumber}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-900/40 text-green-300 ring-1 ring-green-700/30">
                    ● Active
                  </span>
                </div>

                {/* Name & tag */}
                <div>
                  <p className="text-[#F5C518] text-xs font-semibold mb-1">{b.tag}</p>
                  <h3 className="text-white font-bold text-base leading-snug">{b.name}</h3>
                </div>

                {/* Address */}
                <div className="flex gap-2">
                  <span className="text-[#F5C518] shrink-0 mt-0.5">📍</span>
                  <p className="text-gray-300 text-xs leading-relaxed">{b.address}</p>
                </div>

                {/* Landmark */}
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0 mt-0.5">🏙️</span>
                  <p className="text-gray-500 text-xs">{b.landmark}</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-white/10">
                  <a href={b.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5C518] text-[#0B0B3B] text-sm font-bold hover:bg-yellow-300 active:scale-95 transition-all">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                    </svg>
                    Get Directions
                  </a>
                  <a href={`https://wa.me/${b.whatsapp}?text=Hi, I'm interested in ${b.name}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold border border-white/15 hover:bg-white/20 active:scale-95 transition-all">
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTACT FORM ────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Send Us a Message</h2>
            <p className="text-gray-400 text-sm">We&apos;ll get back to you within a few hours.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <ContactForm
              activeBranches={BRANCHES.map(b => ({ branchId: b.branchId, name: b.name }))}
            />
          </div>
        </section>

      </div>

      {/* JSON-LD for SEO */}
      {BRANCHES.map(b => (
        <LocalBusinessJsonLd
          key={b.branchId}
          name={b.name}
          address={b.address}
          city="Jaipur"
          state="Rajasthan"
          pincode="302022"
          phone={[b.phone]}
          whatsapp={b.whatsapp}
        />
      ))}
    </div>
  );
}
