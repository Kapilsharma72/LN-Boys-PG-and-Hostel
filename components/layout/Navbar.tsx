'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, closeMenu]);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="bg-[#0B0B3B] sticky top-0 z-50 shadow-md">
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center justify-between h-16">
          {/* Brand logo / name */}
          <Link
            href="/"
            className={[
              'text-white font-bold text-lg tracking-tight shrink-0',
              'rounded focus-visible:outline focus-visible:outline-2',
              'focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
            ].join(' ')}
            aria-label="LN Boys PG & Hostel — Home"
          >
            <span aria-hidden="true" className="text-[#F5C518]">LN</span>
            {' '}Boys PG &amp; Hostel
          </Link>

          {/* Desktop nav links */}
          <ul
            className="hidden md:flex items-center gap-1"
            role="list"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'px-3 py-2 rounded text-sm font-medium transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
                    isActive(href)
                      ? 'text-[#F5C518] border-b-2 border-[#F5C518]'
                      : 'text-white hover:text-[#F5C518] hover:bg-white/10',
                  ].join(' ')}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://wa.me/918385857902?text=Hi, I want to book a visit to LN Boys PG"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F5C518] text-[#0B0B3B] text-sm font-bold hover:bg-yellow-300 active:scale-95 transition-all shadow-md shadow-[#F5C518]/20"
              >
                Book a Visit
              </a>
            </li>
          </ul>

          {/* Hamburger button — mobile only */}
          <button
            type="button"
            className={[
              'md:hidden flex items-center justify-center w-10 h-10 rounded',
              'text-white hover:text-[#F5C518] hover:bg-white/10',
              'focus-visible:outline focus-visible:outline-2',
              'focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
              'transition-colors duration-150',
            ].join(' ')}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            {/* Hamburger / X icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              {menuOpen ? (
                // X icon
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                // Hamburger icon
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={[
            'md:hidden overflow-hidden transition-all duration-200',
            menuOpen ? 'max-h-screen pb-4' : 'max-h-0',
          ].join(' ')}
          aria-hidden={!menuOpen}
        >
          <ul role="list" className="flex flex-col gap-1 mt-1">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'block px-4 py-3 rounded text-sm font-medium transition-colors duration-150',
                    'focus-visible:outline focus-visible:outline-2',
                    'focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
                    isActive(href)
                      ? 'text-[#F5C518] bg-white/10 border-l-4 border-[#F5C518]'
                      : 'text-white hover:text-[#F5C518] hover:bg-white/10',
                  ].join(' ')}
                  aria-current={isActive(href) ? 'page' : undefined}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <a
                href="https://wa.me/918385857902?text=Hi, I want to book a visit to LN Boys PG"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={menuOpen ? 0 : -1}
                className="block px-4 py-3 rounded-lg bg-[#F5C518] text-[#0B0B3B] text-sm font-bold text-center"
              >
                💬 Book a Visit on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
