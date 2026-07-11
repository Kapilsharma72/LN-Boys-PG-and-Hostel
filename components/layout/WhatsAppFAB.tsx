/**
 * WhatsAppFAB — WhatsApp Floating Action Button
 *
 * Server Component. Renders a fixed circular button in the bottom-right
 * corner of every public page, linking directly to the hostel's WhatsApp.
 */

const WA_HREF =
  'https://wa.me/918385857902?text=Hi%2C%20I%20want%20to%20know%20more%20about%20LN%20Boys%20PG';

export default function WhatsAppFAB() {
  return (
    <a
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={[
        /* position */
        'fixed bottom-6 right-6 z-50',
        /* shape & size */
        'flex items-center justify-center w-14 h-14 rounded-full',
        /* brand colour */
        'bg-[#25D366]',
        /* shadow for visual pop */
        'shadow-lg shadow-[#25D366]/40',
        /* hover: scale up slightly */
        'transition-transform duration-200 ease-out',
        'hover:scale-110 hover:bg-[#1ebe5d]',
        /* focus indicator — gold outline matching brand */
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[#F5C518]',
      ].join(' ')}
    >
      {/* WhatsApp SVG icon — white on transparent */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className="w-8 h-8"
        fill="white"
      >
        {/*
          Standard WhatsApp "phone in speech bubble" icon path.
          Source: https://simpleicons.org — WhatsApp brand asset.
        */}
        <path d="M16 0C7.164 0 0 7.163 0 16c0 2.824.738 5.479 2.027 7.785L0 32l8.418-2.004A15.93 15.93 0 0 0 16 32c8.836 0 16-7.163 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.77-1.845l-.485-.288-5.003 1.192 1.218-4.87-.316-.5A13.271 13.271 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.907c-.396-.198-2.347-1.157-2.71-1.29-.364-.13-.63-.197-.895.198-.265.395-1.03 1.29-1.263 1.556-.231.264-.463.297-.86.099-.396-.198-1.672-.616-3.185-1.965-1.177-1.05-1.971-2.347-2.203-2.742-.232-.396-.025-.61.174-.807.18-.178.396-.463.595-.695.198-.231.264-.396.396-.66.132-.264.066-.496-.033-.695-.1-.198-.895-2.16-1.226-2.956-.322-.775-.65-.67-.895-.682l-.762-.013c-.264 0-.694.099-.1058.495-.364.396-1.39 1.357-1.39 3.31s1.422 3.839 1.62 4.103c.199.264 2.8 4.274 6.786 5.993.949.41 1.69.655 2.267.839.952.303 1.82.26 2.504.158.764-.114 2.347-.958 2.678-1.884.33-.926.33-1.72.231-1.885-.099-.165-.364-.264-.762-.462z" />
      </svg>
    </a>
  );
}
