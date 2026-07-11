'use client';

/**
 * SanitizedContent
 *
 * A minimal client component whose sole job is to sanitize an HTML string
 * with DOMPurify (which requires the browser DOM) and render it safely.
 *
 * DOMPurify is NOT safe to run in a Node.js server component without a DOM
 * shim, so sanitization is deferred to the client. The HTML string has
 * already been generated from Markdown by `marked` on the server; this
 * component only strips any dangerous tags/attributes before injection.
 *
 * Props:
 *  - html: raw HTML string produced by `marked` on the server
 *  - className: optional Tailwind / CSS class string for the wrapper element
 */

import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

interface SanitizedContentProps {
  html: string;
  className?: string;
}

export default function SanitizedContent({ html, className }: SanitizedContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Sanitize in-place after mount so DOMPurify runs in the real browser DOM.
      const clean = DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        // Disallow all forms of script execution and dangerous attributes.
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      });
      containerRef.current.innerHTML = clean;
    }
  }, [html]);

  // Render the raw HTML on the server so the page is immediately readable by
  // crawlers and users with JS disabled; DOMPurify will re-sanitize client-side
  // after hydration.
  return (
    <div
      ref={containerRef}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized by DOMPurify on client
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
