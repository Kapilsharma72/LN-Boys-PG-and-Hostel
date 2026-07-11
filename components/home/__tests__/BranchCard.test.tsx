/**
 * Property-based tests for BranchCard active/coming-soon rendering.
 *
 * **Validates: Requirements 2.4, 2.5, 4.6**
 *
 * Property 4: Active branch cards render an enabled anchor to the correct branch detail URL
 *   For any Branch document with status === "active", BranchCard shall render a single <a>
 *   element (not a <button>) whose href equals /branch/{branchId}.
 *
 * Property 5: Coming-soon branch cards render a disabled button, not a navigable anchor
 *   For any Branch document with status === "coming-soon", BranchCard shall render the
 *   "View Details" control as a disabled <button> (not an <a> tag), and shall not produce
 *   any navigation link.
 *
 * Sub-properties tested:
 *   4a — Active card renders exactly one <a> element
 *   4b — Active card <a> href equals /branch/{branchId}
 *   4c — Active card outer element is NOT a <button>
 *   4d — Active card <a> is not disabled
 *   5a — Coming-soon card renders a <button> as the outer wrapper
 *   5b — Coming-soon card <button> has the disabled attribute
 *   5c — Coming-soon card renders no navigable <a> element
 *   5d — Coming-soon card outer element is a <button>, not an <a>
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import BranchCard, { type BranchCardProps } from '../BranchCard';

// ---------------------------------------------------------------------------
// Mock next/link so it renders a plain <a> in jsdom (standard practice for
// Next.js component tests). The href prop is forwarded to the <a> element.
// ---------------------------------------------------------------------------

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    'aria-label': ariaLabel,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    'aria-label'?: string;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel} {...rest}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid URL-safe branchId: lowercase alphanumeric segments separated
 * by hyphens (matches the pattern ^[a-z0-9]+(-[a-z0-9]+)*$).
 */
const branchIdArb: fc.Arbitrary<string> = fc
  .array(
    fc.stringMatching(/^[a-z0-9]{1,15}$/),
    { minLength: 1, maxLength: 4 },
  )
  .filter((parts) => parts.every((p) => p.length > 0))
  .map((parts) => parts.join('-'));

/** Generates a non-empty branch name (1–120 characters). */
const branchNameArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 120 });

/** Generates a valid starting price (0.01–999999.99). */
const startingPriceArb: fc.Arbitrary<number> = fc.float({
  min: Math.fround(0.01),
  max: Math.fround(999999.99),
  noNaN: true,
  noDefaultInfinity: true,
});

/** Generates a valid rating (0.0–5.0). */
const ratingArb: fc.Arbitrary<number> = fc.float({
  min: Math.fround(0.0),
  max: Math.fround(5.0),
  noNaN: true,
  noDefaultInfinity: true,
});

/** Generates a non-empty city string (1–60 characters). */
const cityArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 60 });

/** Generates a full active BranchCardProps object. */
const activeBranchPropsArb: fc.Arbitrary<BranchCardProps> = fc.record({
  branchId: branchIdArb,
  name: branchNameArb,
  startingPrice: startingPriceArb,
  rating: ratingArb,
  city: cityArb,
  status: fc.constant('active' as const),
});

/** Generates a full coming-soon BranchCardProps object. */
const comingSoonBranchPropsArb: fc.Arbitrary<BranchCardProps> = fc.record({
  branchId: branchIdArb,
  name: branchNameArb,
  startingPrice: startingPriceArb,
  rating: ratingArb,
  city: cityArb,
  status: fc.constant('coming-soon' as const),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders a BranchCard with the given props and returns the container element.
 * Uses @testing-library/react so we get full DOM output.
 */
function renderCard(props: BranchCardProps) {
  const { container } = render(<BranchCard {...props} />);
  return container;
}

// ---------------------------------------------------------------------------
// Property 4 — Active branch cards render an enabled anchor to the correct URL
// ---------------------------------------------------------------------------

describe('Property 4 — Active branch cards render an enabled anchor', () => {
  /**
   * Property 4a: Active card renders at least one <a> element as the outer wrapper.
   */
  it('4a — renders an <a> element as the outer wrapper for any active branch', () => {
    fc.assert(
      fc.property(activeBranchPropsArb, (props) => {
        const container = renderCard(props);
        // The outer element (first child of container) must be an <a>
        const outerElement = container.firstElementChild;
        expect(outerElement?.tagName).toBe('A');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4b: Active card <a> href equals /branch/{branchId}.
   */
  it('4b — active card <a> href equals /branch/{branchId} for any branchId', () => {
    fc.assert(
      fc.property(activeBranchPropsArb, (props) => {
        const container = renderCard(props);
        const anchor = container.querySelector('a');
        expect(anchor).not.toBeNull();
        expect(anchor?.getAttribute('href')).toBe(`/branch/${props.branchId}`);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4c: Active card outer element is NOT a <button>.
   */
  it('4c — active card outer element is never a <button>', () => {
    fc.assert(
      fc.property(activeBranchPropsArb, (props) => {
        const container = renderCard(props);
        const outerElement = container.firstElementChild;
        expect(outerElement?.tagName).not.toBe('BUTTON');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4d: Active card <a> has no disabled attribute.
   */
  it('4d — active card <a> has no disabled attribute', () => {
    fc.assert(
      fc.property(activeBranchPropsArb, (props) => {
        const container = renderCard(props);
        const anchor = container.querySelector('a');
        expect(anchor).not.toBeNull();
        // <a> elements cannot be disabled — confirm the attribute is absent
        expect(anchor?.hasAttribute('disabled')).toBe(false);
        expect(anchor?.getAttribute('aria-disabled')).not.toBe('true');
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Deterministic examples — Property 4
// ---------------------------------------------------------------------------

describe('Property 4 — deterministic examples', () => {
  const activeBranch: BranchCardProps = {
    branchId: 'ln-vidhani-jecrc',
    name: 'LN Vidhani (JECRC)',
    startingPrice: 8000,
    rating: 4.5,
    city: 'Jaipur',
    status: 'active',
  };

  it('renders outer <a> for a known active branch', () => {
    const container = renderCard(activeBranch);
    expect(container.firstElementChild?.tagName).toBe('A');
  });

  it('href is /branch/ln-vidhani-jecrc for the known branchId', () => {
    const container = renderCard(activeBranch);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/branch/ln-vidhani-jecrc');
  });

  it('does not render a <button> in the outer position', () => {
    const container = renderCard(activeBranch);
    expect(container.firstElementChild?.tagName).not.toBe('BUTTON');
  });

  it('branchId with hyphens produces the correct href', () => {
    const props: BranchCardProps = {
      ...activeBranch,
      branchId: 'ln-jagatpura-2',
    };
    const container = renderCard(props);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/branch/ln-jagatpura-2');
  });
});

// ---------------------------------------------------------------------------
// Property 5 — Coming-soon branch cards render a disabled button, not an anchor
// ---------------------------------------------------------------------------

describe('Property 5 — Coming-soon branch cards render a disabled button', () => {
  /**
   * Property 5a: Coming-soon card renders a <button> as the outer wrapper.
   */
  it('5a — renders a <button> as the outer wrapper for any coming-soon branch', () => {
    fc.assert(
      fc.property(comingSoonBranchPropsArb, (props) => {
        const container = renderCard(props);
        const outerElement = container.firstElementChild;
        expect(outerElement?.tagName).toBe('BUTTON');
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5b: Coming-soon card <button> has the disabled attribute.
   */
  it('5b — coming-soon card <button> is disabled for any coming-soon branch', () => {
    fc.assert(
      fc.property(comingSoonBranchPropsArb, (props) => {
        const container = renderCard(props);
        const button = container.querySelector('button');
        expect(button).not.toBeNull();
        expect(button).toBeDisabled();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5c: Coming-soon card renders no navigable <a> element.
   */
  it('5c — coming-soon card contains no <a> element for any coming-soon branch', () => {
    fc.assert(
      fc.property(comingSoonBranchPropsArb, (props) => {
        const container = renderCard(props);
        const anchors = container.querySelectorAll('a');
        expect(anchors.length).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property 5d: Coming-soon card outer element is a <button>, NOT an <a>.
   */
  it('5d — coming-soon card outer element is never an <a>', () => {
    fc.assert(
      fc.property(comingSoonBranchPropsArb, (props) => {
        const container = renderCard(props);
        const outerElement = container.firstElementChild;
        expect(outerElement?.tagName).not.toBe('A');
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Deterministic examples — Property 5
// ---------------------------------------------------------------------------

describe('Property 5 — deterministic examples', () => {
  const comingSoonBranch: BranchCardProps = {
    branchId: 'ln-sitapura',
    name: 'LN Sitapura (Coming Soon)',
    startingPrice: 9000,
    rating: 0,
    city: 'Jaipur',
    status: 'coming-soon',
  };

  it('renders outer <button> for a known coming-soon branch', () => {
    const container = renderCard(comingSoonBranch);
    expect(container.firstElementChild?.tagName).toBe('BUTTON');
  });

  it('outer <button> is disabled', () => {
    const container = renderCard(comingSoonBranch);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  it('contains no <a> element', () => {
    const container = renderCard(comingSoonBranch);
    const anchors = container.querySelectorAll('a');
    expect(anchors).toHaveLength(0);
  });

  it('outer element is not an <a> tag', () => {
    const container = renderCard(comingSoonBranch);
    expect(container.firstElementChild?.tagName).not.toBe('A');
  });

  it('does not navigate to /branch/ln-sitapura (no href found in document)', () => {
    const container = renderCard(comingSoonBranch);
    const elementsWithHref = container.querySelectorAll('[href]');
    expect(elementsWithHref).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Cross-property: status transition consistency
// ---------------------------------------------------------------------------

describe('Status determines element type — cross-property', () => {
  it('same branchId renders <a> when active and <button> when coming-soon', () => {
    const base = {
      branchId: 'ln-vaishali-nagar',
      name: 'LN Vaishali Nagar',
      startingPrice: 8500,
      rating: 4.2,
      city: 'Jaipur',
    };

    const activeContainer = renderCard({ ...base, status: 'active' });
    const comingSoonContainer = renderCard({ ...base, status: 'coming-soon' });

    expect(activeContainer.firstElementChild?.tagName).toBe('A');
    expect(comingSoonContainer.firstElementChild?.tagName).toBe('BUTTON');
  });

  it('property holds across arbitrary branchIds for both status variants', () => {
    fc.assert(
      fc.property(branchIdArb, branchNameArb, cityArb, (branchId, name, city) => {
        const baseProps = { branchId, name, startingPrice: 8000, rating: 4.0, city };

        const activeContainer = renderCard({ ...baseProps, status: 'active' });
        const comingSoonContainer = renderCard({ ...baseProps, status: 'coming-soon' });

        // Active → <a> with correct href
        const outerActive = activeContainer.firstElementChild;
        expect(outerActive?.tagName).toBe('A');
        expect(outerActive?.getAttribute('href')).toBe(`/branch/${branchId}`);

        // Coming-soon → disabled <button>, no <a>
        const outerComingSoon = comingSoonContainer.firstElementChild;
        expect(outerComingSoon?.tagName).toBe('BUTTON');
        expect(outerComingSoon).toBeDisabled();
        expect(comingSoonContainer.querySelectorAll('a')).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});
