import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | LN Boys PG & Hostel',
  description:
    'The page you are looking for could not be found. Return to the LN Boys PG & Hostel homepage.',
};

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Locations', href: '/locations' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Blog', href: '/blog' },
] as const;

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0B3B] flex flex-col">
      {/* Main content */}
      <main
        className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center"
        aria-labelledby="not-found-heading"
      >
        {/* 404 status indicator */}
        <p
          className="text-[#F5C518] text-8xl sm:text-9xl font-extrabold leading-none select-none"
          aria-hidden="true"
        >
          404
        </p>

        <h1
          id="not-found-heading"
          className="mt-4 text-2xl sm:text-3xl font-bold text-white"
        >
          Page Not Found
        </h1>

        <p className="mt-4 text-gray-400 max-w-md leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Head back to our homepage to find what you need.
        </p>

        {/* Primary CTA */}
        <Link
          href="/"
          className={[
            'mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-lg',
            'bg-[#F5C518] text-[#0B0B3B] font-semibold text-sm',
            'hover:bg-yellow-400 transition-colors duration-150',
            'focus-visible:outline focus-visible:outline-2',
            'focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
          ].join(' ')}
        >
          <span aria-hidden="true">←</span>
          Back to Homepage
        </Link>

        {/* Site navigation */}
        <nav
          aria-label="Site navigation"
          className="mt-14 w-full max-w-sm"
        >
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">
            Or explore these pages
          </p>
          <ul role="list" className="flex flex-col gap-2">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'block px-4 py-3 rounded-lg text-sm font-medium',
                    'bg-[#12124a] border border-[#1e1e6e] text-white',
                    'hover:border-[#F5C518] hover:text-[#F5C518] transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
                  ].join(' ')}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
