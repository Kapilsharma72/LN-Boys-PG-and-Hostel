/**
 * TestimonialsSection — Real student reviews.
 * Styled like the reference screenshot: avatar initials, star rating, date, quote.
 */

const REVIEWS = [
  {
    name: 'Pradumn Singh',
    initial: 'P',
    color: 'bg-yellow-500',
    rating: 5,
    date: '03 Nov 2025',
    text: 'Everything here works the way it should — rooms are fresh, food is consistent, and the management actually responds. Feels like a proper home, not a cramped rental.',
  },
  {
    name: 'Thummi Hemanth',
    initial: 'T',
    color: 'bg-green-600',
    rating: 5,
    date: '01 Nov 2025',
    text: 'I booked as a temporary stay and ended up extending twice. The space feels homely but professional — you can study, relax, and live comfortably without any stress.',
  },
  {
    name: 'Kanishka Sharma',
    initial: 'K',
    color: 'bg-blue-600',
    rating: 5,
    date: '30 Oct 2025',
    text: 'Rooms are spacious and fully equipped. The food is really great — ghar jaisa khaana. It truly feels like a home away from home.',
  },
  {
    name: 'Abhishek Singh',
    initial: 'A',
    color: 'bg-purple-600',
    rating: 5,
    date: '29 Oct 2025',
    text: 'Feel homely and safe staying here. Rooms are clean and maintained regularly. The free auto to JECRC is a huge plus — saves so much daily hassle.',
  },
  {
    name: 'Sakshi Tiwari',
    initial: 'S',
    color: 'bg-pink-600',
    rating: 5,
    date: '11 Oct 2025',
    text: 'The management ensures everything is in order daily. Housekeeping staff are polite and cooperative. Very satisfied with the overall experience.',
  },
  {
    name: 'Rahul Meena',
    initial: 'R',
    color: 'bg-orange-600',
    rating: 5,
    date: '05 Oct 2025',
    text: 'Best PG near JECRC, no doubt. Security is 24×7 and Wi-Fi never drops. The Sunday special lunch is something I look forward to every week!',
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-[#F5C518]' : 'text-gray-600'}`}
          viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section
      className="w-full bg-[#0B0B3B] border-t border-white/10 py-20 px-4 sm:px-6 lg:px-8"
      aria-label="Student reviews"
    >
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 rounded-full bg-[#F5C518]/10 text-[#F5C518] text-xs font-semibold uppercase tracking-wider mb-3 border border-[#F5C518]/20">
            Student Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            What Our Residents <span className="text-[#F5C518]">Say</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            Real reviews from students living at LN Boys PG & Hostel.
          </p>
          {/* Overall rating bar */}
          <div className="inline-flex items-center gap-3 mt-4 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
            <span className="text-3xl font-extrabold text-[#F5C518]">4.8</span>
            <div className="flex flex-col items-start">
              <StarRating count={5} />
              <span className="text-gray-400 text-xs mt-0.5">Based on 50+ reviews</span>
            </div>
          </div>
        </div>

        {/* Review grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REVIEWS.map(r => (
            <article
              key={r.name}
              className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#F5C518]/30 hover:bg-[#F5C518]/5 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${r.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {r.initial}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{r.name}</p>
                    <p className="text-gray-500 text-xs">{r.date}</p>
                  </div>
                </div>
                <StarRating count={r.rating} />
              </div>
              {/* Divider */}
              <div className="h-px bg-white/10" />
              {/* Text */}
              <p className="text-gray-300 text-sm leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>
              {/* Verified badge */}
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified Resident
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
