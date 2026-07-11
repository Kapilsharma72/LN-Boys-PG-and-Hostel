'use client';
/**
 * FaqSection — Frequently asked questions for students.
 * Covers critical gaps: admission, fees, food, rules, transport.
 */

import { useState } from 'react';

const FAQS = [
  {
    q: 'What documents are needed for admission?',
    a: 'You need a valid government photo ID (Aadhaar / PAN / Voter ID / Passport / Driving Licence), 2 passport-size photographs, and college admission proof. Parents\' ID is also required at the time of joining.',
  },
  {
    q: 'How much is the security deposit?',
    a: '2 months\' security deposit + 1 month advance rent is collected at admission. The full deposit is refunded when you vacate, after deducting any damages.',
  },
  {
    q: 'Is the food vegetarian only?',
    a: 'Yes — we serve 100% pure vegetarian home-cooked meals: breakfast, lunch, and dinner daily. Sunday lunch is special (Paneer Butter Masala + Kheer).',
  },
  {
    q: 'What are the meal timings?',
    a: 'Breakfast: 7–9 AM · Lunch: 12–2 PM · Dinner: 8–10 PM. Food must be eaten in the mess — not allowed in rooms.',
  },
  {
    q: 'Is there a curfew or entry/exit time?',
    a: 'Yes. All residents must return to the hostel by a reasonable time. Entry/exit is logged at the gate. Prior permission is required for late-night stays outside.',
  },
  {
    q: 'Can parents visit the hostel?',
    a: 'Yes, parents can visit during visiting hours (10 AM – 8 PM, all days). Please inform the warden in advance.',
  },
  {
    q: 'How does the free auto service work?',
    a: 'We run a free electric auto pickup & drop to JECRC University — morning at 8:00 AM and evening at 5:30 PM. Available for all LN Boys PG residents.',
  },
  {
    q: 'Is Wi-Fi available 24×7?',
    a: 'Yes. High-speed Wi-Fi is available throughout the premises — in rooms, common areas, and the study room.',
  },
  {
    q: 'What room types are available?',
    a: '2-Seater (Double) and 3-Seater (Triple) rooms. All come with AC, Cooler, or Non-AC variants. Each room has a study table, chair, almirah, bed, and attached washroom.',
  },
  {
    q: 'What is the monthly rent?',
    a: 'Starting from ₹7,000/month for triple non-AC rooms. Double AC rooms go up to ₹9,000/month. All prices include 3 meals/day, Wi-Fi, and all amenities.',
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      className="w-full bg-gradient-to-b from-[#0B0B3B] to-[#0d0d45] border-t border-white/10 py-20 px-4 sm:px-6 lg:px-8"
      aria-label="Frequently asked questions"
    >
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-[#F5C518]/10 text-[#F5C518] text-xs font-semibold uppercase tracking-wider mb-3 border border-[#F5C518]/20">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Questions Students <span className="text-[#F5C518]">Always Ask</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Everything about admission, fees, food, and rules — answered clearly.
          </p>
        </div>

        {/* FAQ accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`rounded-2xl border transition-all duration-200 ${
                open === i ? 'border-[#F5C518]/40 bg-[#F5C518]/5' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className={`font-semibold text-sm sm:text-base ${open === i ? 'text-[#F5C518]' : 'text-white'}`}>
                  {faq.q}
                </span>
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    open === i ? 'bg-[#F5C518] text-[#0B0B3B] rotate-45' : 'bg-white/10 text-white'
                  }`}
                  aria-hidden="true"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-gray-300 text-sm leading-relaxed border-t border-white/10 pt-3">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-gray-500 text-sm mb-3">Still have questions?</p>
          <a
            href="https://wa.me/918385857902?text=Hi, I have a question about LN Boys PG"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/20 active:scale-95 transition-all"
          >
            💬 Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
