/**
 * TrustStrip — Displays exactly four trust signals on the Home page.
 *
 * Server Component. Requirements: 2.6
 *
 * The four signals:
 * 1. "3 Meals/Day"
 * 2. "24×7 CCTV Security"
 * 3. "High-Speed Wi-Fi"
 * 4. "Starting ₹7,000/month"
 */

const TRUST_SIGNALS = [
  {
    label: '3 Meals/Day',
    desc: 'Home-cooked breakfast, lunch & dinner',
    emoji: '🍽️',
  },
  {
    label: '24×7 CCTV Security',
    desc: 'Round-the-clock surveillance & guard',
    emoji: '📷',
  },
  {
    label: 'High-Speed Wi-Fi',
    desc: 'Uninterrupted internet for study & work',
    emoji: '📶',
  },
  {
    label: 'From ₹7,000/month',
    desc: 'Fully furnished AC / Non-AC rooms',
    emoji: '💰',
  },
] as const;

export default function TrustStrip() {
  return (
    <section
      className="w-full bg-gradient-to-b from-[#0B0B3B] to-[#0d0d45] border-t border-white/10 py-16 px-4 sm:px-6 lg:px-8"
      aria-label="Trust signals"
    >
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Why Choose{' '}
            <span className="text-[#F5C518]">LN Boys PG?</span>
          </h2>
        </div>

        <ul
          role="list"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {TRUST_SIGNALS.map(({ label, desc, emoji }) => (
            <li
              key={label}
              className={[
                'flex flex-col items-center text-center gap-3 p-5 rounded-2xl',
                'bg-white/5 border border-white/10',
                'hover:border-[#F5C518]/30 hover:bg-[#F5C518]/5 transition-colors duration-200',
              ].join(' ')}
            >
              <span className="text-4xl" role="img" aria-hidden="true">{emoji}</span>
              <span className="text-white font-bold text-sm sm:text-base leading-tight">
                {label}
              </span>
              <span className="text-gray-400 text-xs leading-relaxed">
                {desc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
