/**
 * StickyEnquiryForm — desktop-only sticky sidebar wrapper for EnquiryForm.
 *
 * Requirements: 3.8
 *
 * - Renders as a sticky sidebar on desktop (>1024 px).
 * - Hidden on mobile/tablet; shown only via `hidden lg:block` utility.
 * - Passes `branchId` prop through to EnquiryForm.
 * - Styled with brand palette: navy background (#0B0B3B), gold accents (#F5C518).
 */

import EnquiryForm from '@/components/forms/EnquiryForm';

interface StickyEnquiryFormProps {
  branchId: string;
}

export default function StickyEnquiryForm({ branchId }: StickyEnquiryFormProps) {
  return (
    <aside
      aria-label="Enquiry sidebar"
      className="hidden lg:block"
    >
      <div
        className="sticky top-6 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ backgroundColor: '#0B0B3B' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b border-white/10"
          style={{ backgroundColor: 'rgba(245, 197, 24, 0.08)' }}
        >
          <h2 className="text-xl font-bold text-white leading-tight">
            Book Your Spot
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#F5C518' }}>
            Schedule a visit or reserve your room today
          </p>
        </div>

        {/* Form body */}
        <div className="px-6 py-6">
          <EnquiryForm branchId={branchId} />
        </div>

        {/* Footer note */}
        <div className="px-6 pb-5">
          <p className="text-xs text-gray-400 text-center">
            Free cancellation · No payment required now
          </p>
        </div>
      </div>
    </aside>
  );
}
