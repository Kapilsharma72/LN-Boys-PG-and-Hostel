/**
 * AutoServiceBanner — Advertisement-style poster for the FREE Electric Auto Service.
 *
 * Server Component.
 * Dark navy background with gold accents, SVG electric auto illustration,
 * timing highlight box, and resident availability note.
 */

export default function AutoServiceBanner() {
  return (
    <section
      className="w-full bg-[#0B0B3B] px-4 sm:px-6 lg:px-8 py-10"
      aria-label="Free Auto Service advertisement"
    >
      <div className="max-w-4xl mx-auto">
        <div
          className={[
            'relative rounded-2xl overflow-hidden',
            'border border-[#F5C518]/30',
            'bg-gradient-to-br from-[#0d0d45] via-[#0B0B3B] to-[#0d0d45]',
            'shadow-xl shadow-[#F5C518]/5',
          ].join(' ')}
        >
          {/* Background glow accents */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#F5C518]/5 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[#F5C518]/8 blur-2xl pointer-events-none" aria-hidden="true" />

          {/* "FREE" ribbon — top-right */}
          <div
            className="absolute top-4 right-4 bg-[#F5C518] text-[#0B0B3B] font-extrabold text-xs px-3 py-1 rounded-full shadow-md"
            aria-hidden="true"
          >
            FREE
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6 p-6 sm:p-8">
            {/* SVG Electric Auto Illustration */}
            <div className="flex-shrink-0" aria-hidden="true">
              <ElectricAutoSvg />
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              {/* Headline */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1 leading-tight">
                🚗{' '}
                <span className="text-[#F5C518]">FREE Auto Service</span>
              </h2>

              {/* Subheading */}
              <p className="text-gray-300 text-sm sm:text-base mb-4">
                Daily pickup &amp; drop from PG to JECRC University
              </p>

              {/* Timing highlight box */}
              <div
                className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-[#F5C518]/10 border border-[#F5C518]/40 rounded-xl px-5 py-3 mb-4"
                aria-label="Service timings"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-semibold text-sm">Morning:</span>
                  <span className="text-[#F5C518] font-bold text-sm">8:00 AM</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-[#F5C518]/30" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-semibold text-sm">Evening:</span>
                  <span className="text-[#F5C518] font-bold text-sm">5:30 PM</span>
                </div>
              </div>

              {/* Availability note */}
              <p className="text-gray-400 text-xs">
                ✅ Available for all <span className="text-white font-medium">LN Boys PG</span> residents
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Inline SVG illustration of an electric auto-rickshaw */
function ElectricAutoSvg() {
  return (
    <svg
      width="140"
      height="100"
      viewBox="0 0 140 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Electric auto-rickshaw illustration"
    >
      {/* Body — navy */}
      <rect x="10" y="30" width="100" height="45" rx="8" fill="#1a1a6e" />
      {/* Roof */}
      <rect x="18" y="18" width="76" height="18" rx="6" fill="#0B0B3B" stroke="#F5C518" strokeWidth="1.5" />
      {/* Gold trim stripe */}
      <rect x="10" y="58" width="100" height="4" rx="2" fill="#F5C518" opacity="0.7" />
      {/* Windshield */}
      <rect x="25" y="22" width="30" height="12" rx="3" fill="#3a3a8e" opacity="0.8" />
      {/* Side window */}
      <rect x="62" y="22" width="22" height="12" rx="3" fill="#3a3a8e" opacity="0.8" />
      {/* Door line */}
      <line x1="58" y1="30" x2="58" y2="75" stroke="#F5C518" strokeWidth="1" opacity="0.5" />
      {/* Front wheel */}
      <circle cx="30" cy="78" r="11" fill="#0d0d2e" stroke="#F5C518" strokeWidth="2" />
      <circle cx="30" cy="78" r="5" fill="#1a1a6e" />
      {/* Rear wheel */}
      <circle cx="98" cy="78" r="11" fill="#0d0d2e" stroke="#F5C518" strokeWidth="2" />
      <circle cx="98" cy="78" r="5" fill="#1a1a6e" />
      {/* Electric bolt symbol — center body */}
      <polygon
        points="72,40 66,54 71,54 68,66 78,50 72,50"
        fill="#F5C518"
        stroke="#F5C518"
        strokeWidth="0.5"
      />
      {/* Headlight */}
      <ellipse cx="112" cy="50" rx="5" ry="6" fill="#F5C518" opacity="0.9" />
      <ellipse cx="114" cy="50" rx="8" ry="4" fill="#F5C518" opacity="0.15" />
      {/* Handle bar */}
      <rect x="108" y="40" width="18" height="4" rx="2" fill="#2a2a7e" stroke="#F5C518" strokeWidth="1" />
      <circle cx="126" cy="42" r="3" fill="#F5C518" />
    </svg>
  );
}
