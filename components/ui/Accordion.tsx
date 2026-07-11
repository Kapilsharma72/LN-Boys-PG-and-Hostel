'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

/**
 * Accessible Accordion component.
 *
 * Client Component — Requirements: 7.4, 14.7
 *
 * Accessibility:
 * - Each trigger is a native <button> (implicit role="button"; ARIA 1.1 accordion pattern)
 * - aria-expanded reflects open/closed state
 * - aria-controls / aria-labelledby link trigger ↔ panel
 * - role="region" on panel (landmark for screen readers)
 * - Enter and Space toggle via native button keyboard handling
 * - Visible focus indicator: 2 px gold (#F5C518) outline, ≥3:1 contrast on navy bg
 *
 * Exclusivity:
 * - A single shared `openId` per <Accordion> group ensures at most one item is open
 *
 * prefers-reduced-motion:
 * - CSS transition on the panel height is disabled via the `motion-reduce:` Tailwind variant
 * - The global `globals.css` also zeroes transition-duration for all elements under
 *   @media (prefers-reduced-motion: reduce), providing a belt-and-suspenders guarantee
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccordionItemData {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  /** Optional initial open item id */
  defaultOpenId?: string;
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

// ---------------------------------------------------------------------------
// AccordionPanel — animated expand/collapse
// ---------------------------------------------------------------------------

interface AccordionPanelProps {
  id: string;
  triggerId: string;
  isOpen: boolean;
  children: ReactNode;
  contentClassName?: string;
}

function AccordionPanel({
  id,
  triggerId,
  isOpen,
  children,
  contentClassName = '',
}: AccordionPanelProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(isOpen ? 'auto' : 0);

  // Measure and animate height on open/close
  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    if (isOpen) {
      const measured = inner.scrollHeight;
      setHeight(measured);
      // After transition ends, set to 'auto' so content can reflow freely
      const tid = setTimeout(() => setHeight('auto'), 220);
      return () => clearTimeout(tid);
    } else {
      // Collapse: first pin the current pixel height so transition can animate to 0
      if (height === 'auto') {
        const measured = inner.scrollHeight;
        setHeight(measured);
        // Let the browser paint the measured height, then animate to 0
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setHeight(0));
        });
      } else {
        setHeight(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={triggerId}
      aria-hidden={!isOpen}
      style={{ height: height === 'auto' ? 'auto' : `${height}px` }}
      className={[
        'overflow-hidden',
        // Transition height — disabled automatically by globals.css under prefers-reduced-motion
        'transition-[height] duration-200 ease-in-out',
        // Belt-and-suspenders: Tailwind motion-reduce variant
        'motion-reduce:transition-none motion-reduce:duration-0',
      ].join(' ')}
    >
      <div ref={innerRef} className={contentClassName}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion — group wrapper
// ---------------------------------------------------------------------------

export function Accordion({
  items,
  defaultOpenId,
  className = '',
  itemClassName = '',
  triggerClassName = '',
  contentClassName = '',
}: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  // Keyboard handler — Enter/Space are already handled by native <button>,
  // but we add Escape to close the current item per ARIA Authoring Practices.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
      if (e.key === 'Escape' && openId === id) {
        e.preventDefault();
        setOpenId(null);
      }
    },
    [openId],
  );

  return (
    <div className={className}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `accordion-trigger-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        return (
          <div key={item.id} className={itemClassName}>
            {/* Trigger */}
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              className={[
                triggerClassName,
                // WCAG 2.1 AA visible focus: 2 px gold outline, offset so it clears the element
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                'focus-visible:outline-[#F5C518]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.title}
              {/* Chevron — rotates on open; transition disabled when motion-reduce */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={[
                  'h-5 w-5 shrink-0',
                  'transition-transform duration-200',
                  'motion-reduce:transition-none motion-reduce:duration-0',
                  isOpen ? 'rotate-180' : 'rotate-0',
                ].join(' ')}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
                focusable="false"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Panel */}
            <AccordionPanel
              id={panelId}
              triggerId={triggerId}
              isOpen={isOpen}
              contentClassName={contentClassName}
            >
              {item.content}
            </AccordionPanel>
          </div>
        );
      })}
    </div>
  );
}

// Default export for convenience
export default Accordion;
