// @vitest-environment jsdom
/**
 * Property-based tests for AccordionPolicies sort order and accordion exclusivity.
 *
 * **Validates: Requirements 3.6, 7.2, 7.4**
 *
 * Property 22: Policies are ordered by `order` field ascending within each branch group.
 * Property 23: Accordion exclusivity — at most one item per branch group is expanded at a time.
 *
 * Sub-properties tested:
 *   22a — Sorting: for any arbitrary list of policies, rendered items are ordered by `order` ascending
 *   22b — Stability: policies with same `order` value maintain their input order (stable sort)
 *   22c — Non-mutation: input array is never mutated by the sort operation
 *   23a — Exclusivity: clicking an accordion item expands it and collapses any previously open item
 *   23b — Toggle: clicking an already-open item collapses it (no items open)
 *   23c — Initial state: all items start collapsed (no item has aria-expanded="true" on mount)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccordionPolicies, { type Policy } from '@/components/branch/AccordionPolicies';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for a single Policy object */
const policyArb: fc.Arbitrary<Policy> = fc.record({
  _id: fc.uuid(),
  branchId: fc.string({ minLength: 3, maxLength: 40 }),
  title: fc.string({ minLength: 1, maxLength: 120 }),
  body: fc.string({ minLength: 1, maxLength: 500 }), // Shortened for test performance
  order: fc.integer({ min: 0, max: 100 }),
});

/** Arbitrary for an array of policies (0–20 items) */
const policyArrayArb: fc.Arbitrary<Policy[]> = fc.array(policyArb, {
  minLength: 0,
  maxLength: 20,
});

/** Arbitrary for an array with at least 2 policies (needed for exclusivity tests) */
const atLeast2PoliciesArb: fc.Arbitrary<Policy[]> = fc.array(policyArb, {
  minLength: 2,
  maxLength: 15,
});

// ─── Property 22a — Sorting by `order` ascending ─────────────────────────────

describe('Property 22a — policies rendered in ascending order by `order` field', () => {
  it('for any arbitrary list of policies, rendered items are sorted by order ascending', () => {
    fc.assert(
      fc.property(policyArrayArb, (policies) => {
        // Skip empty arrays (no DOM to test)
        fc.pre(policies.length > 0);

        const { container } = render(<AccordionPolicies policies={policies} />);

        // Extract all accordion trigger buttons (policy titles)
        // Note: button textContent includes the chevron SVG, so we need to extract just the text node
        const buttons = container.querySelectorAll('button[aria-expanded]');
        const renderedTitles = Array.from(buttons).map((btn) => {
          // Get the first text node content (before the SVG)
          const textContent = btn.childNodes[0]?.textContent?.trim() || btn.textContent?.replace(/\s+/g, ' ').trim() || '';
          return textContent;
        });

        // Build expected order: sort by `order` ascending, then map to titles
        const sorted = [...policies].sort((a, b) => a.order - b.order);
        const expectedTitles = sorted.map((p) => p.title.trim());

        expect(renderedTitles).toEqual(expectedTitles);
      }),
      { numRuns: 100 },
    );
  });

  it('policies with smallest order values appear first in the DOM', () => {
    fc.assert(
      fc.property(policyArrayArb, (policies) => {
        fc.pre(policies.length >= 2);

        const { container } = render(<AccordionPolicies policies={policies} />);
        const buttons = container.querySelectorAll('button[aria-expanded]');
        const renderedTitles = Array.from(buttons).map((btn) => {
          // Get the first text node content (before the SVG)
          const textContent = btn.childNodes[0]?.textContent?.trim() || btn.textContent?.replace(/\s+/g, ' ').trim() || '';
          return textContent;
        });

        const sorted = [...policies].sort((a, b) => a.order - b.order);

        // First rendered title should match the policy with smallest order
        expect(renderedTitles[0]).toBe(sorted[0].title.trim());
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 22b — Stable sort (same order values) ──────────────────────────

describe('Property 22b — policies with same order value maintain input order (stable sort)', () => {
  it('when multiple policies have the same order, input order is preserved', () => {
    // Create 5 policies all with order=5, with unique titles to track position
    const policies: Policy[] = Array.from({ length: 5 }, (_, i) => ({
      _id: `id-${i}`,
      branchId: 'branch-1',
      title: `Policy ${i}`,
      body: 'Body text',
      order: 5,
    }));

    const { container } = render(<AccordionPolicies policies={policies} />);
    const buttons = container.querySelectorAll('button[aria-expanded]');
    const renderedTitles = Array.from(buttons).map((btn) =>
      btn.textContent?.trim() || '',
    );

    // Since all have the same order, output should match input order exactly
    const expectedTitles = policies.map((p) => p.title);
    expect(renderedTitles).toEqual(expectedTitles);
  });

  it('stable sort: when orders are [5,5,3,3], items maintain relative order within same-order groups', () => {
    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'A-order5', body: 'X', order: 5 },
      { _id: '2', branchId: 'b1', title: 'B-order5', body: 'Y', order: 5 },
      { _id: '3', branchId: 'b1', title: 'C-order3', body: 'Z', order: 3 },
      { _id: '4', branchId: 'b1', title: 'D-order3', body: 'W', order: 3 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const buttons = container.querySelectorAll('button[aria-expanded]');
    const renderedTitles = Array.from(buttons).map((btn) =>
      btn.textContent?.trim() || '',
    );

    // Expected: order 3 items first (C, D in input order), then order 5 items (A, B in input order)
    expect(renderedTitles).toEqual(['C-order3', 'D-order3', 'A-order5', 'B-order5']);
  });
});

// ─── Property 22c — Non-mutation (input array never mutated) ─────────────────

describe('Property 22c — input array is never mutated by the sort operation', () => {
  it('the original policies array remains unchanged after rendering', () => {
    fc.assert(
      fc.property(policyArrayArb, (policies) => {
        fc.pre(policies.length > 0);

        // Create a deep copy of the input to compare after rendering
        const originalSnapshot = JSON.parse(JSON.stringify(policies));

        render(<AccordionPolicies policies={policies} />);

        // Verify input array was not mutated
        expect(policies).toEqual(originalSnapshot);
      }),
      { numRuns: 100 },
    );
  });

  it('policies array reference is not modified (identity check)', () => {
    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Z Policy', body: 'Text', order: 10 },
      { _id: '2', branchId: 'b1', title: 'A Policy', body: 'Text', order: 1 },
    ];

    const originalRef = policies;
    render(<AccordionPolicies policies={policies} />);

    // The same array reference should be intact
    expect(policies).toBe(originalRef);
    // And the order of elements in the original array should be unchanged
    expect(policies[0]._id).toBe('1');
    expect(policies[1]._id).toBe('2');
  });
});

// ─── Property 23a — Exclusivity: at most one item expanded ───────────────────

describe('Property 23a — clicking an item expands it and collapses any previously open item', () => {
  it('opening a second accordion item closes the first one', async () => {
    const user = userEvent.setup();

    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Policy One', body: 'Body 1', order: 1 },
      { _id: '2', branchId: 'b1', title: 'Policy Two', body: 'Body 2', order: 2 },
      { _id: '3', branchId: 'b1', title: 'Policy Three', body: 'Body 3', order: 3 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);

    const buttons = container.querySelectorAll('button[aria-expanded]');
    expect(buttons.length).toBe(3);

    const [btn1, btn2, btn3] = Array.from(buttons) as HTMLButtonElement[];

    // Initially all collapsed
    expect(btn1.getAttribute('aria-expanded')).toBe('false');
    expect(btn2.getAttribute('aria-expanded')).toBe('false');
    expect(btn3.getAttribute('aria-expanded')).toBe('false');

    // Click first item → expands
    await user.click(btn1);
    expect(btn1.getAttribute('aria-expanded')).toBe('true');
    expect(btn2.getAttribute('aria-expanded')).toBe('false');
    expect(btn3.getAttribute('aria-expanded')).toBe('false');

    // Click second item → first collapses, second expands (exclusivity)
    await user.click(btn2);
    expect(btn1.getAttribute('aria-expanded')).toBe('false');
    expect(btn2.getAttribute('aria-expanded')).toBe('true');
    expect(btn3.getAttribute('aria-expanded')).toBe('false');

    // Click third item → second collapses, third expands
    await user.click(btn3);
    expect(btn1.getAttribute('aria-expanded')).toBe('false');
    expect(btn2.getAttribute('aria-expanded')).toBe('false');
    expect(btn3.getAttribute('aria-expanded')).toBe('true');
  });

  it('at any point in time, at most one accordion item has aria-expanded="true"', async () => {
    fc.assert(
      fc.asyncProperty(atLeast2PoliciesArb, async (policies) => {
        const user = userEvent.setup();
        const { container } = render(<AccordionPolicies policies={policies} />);

        const buttons = Array.from(
          container.querySelectorAll('button[aria-expanded]'),
        ) as HTMLButtonElement[];

        // Click each button in sequence and verify only one is expanded
        for (let i = 0; i < buttons.length; i++) {
          await user.click(buttons[i]);

          const expandedCount = buttons.filter(
            (btn) => btn.getAttribute('aria-expanded') === 'true',
          ).length;

          expect(expandedCount).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 50 }, // Reduced runs for async tests
    );
  });
});

// ─── Property 23b — Toggle: clicking open item collapses it ──────────────────

describe('Property 23b — clicking an already-open item collapses it (no items open)', () => {
  it('clicking the same accordion item twice collapses it', async () => {
    const user = userEvent.setup();

    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Toggle Policy', body: 'Body', order: 1 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const button = container.querySelector('button[aria-expanded]') as HTMLButtonElement;

    // Initially collapsed
    expect(button.getAttribute('aria-expanded')).toBe('false');

    // First click → expand
    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // Second click → collapse
    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('after toggling an item closed, all items are collapsed', async () => {
    const user = userEvent.setup();

    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Policy A', body: 'Body A', order: 1 },
      { _id: '2', branchId: 'b1', title: 'Policy B', body: 'Body B', order: 2 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const buttons = Array.from(
      container.querySelectorAll('button[aria-expanded]'),
    ) as HTMLButtonElement[];

    // Open first item
    await user.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');

    // Close it by clicking again
    await user.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');

    // Verify no item has aria-expanded="true"
    const expandedCount = buttons.filter(
      (btn) => btn.getAttribute('aria-expanded') === 'true',
    ).length;
    expect(expandedCount).toBe(0);
  });
});

// ─── Property 23c — Initial state: all items collapsed ───────────────────────

describe('Property 23c — all accordion items start collapsed on mount', () => {
  it('all items have aria-expanded="false" on initial render', () => {
    fc.assert(
      fc.property(policyArrayArb, (policies) => {
        fc.pre(policies.length > 0);

        const { container } = render(<AccordionPolicies policies={policies} />);
        const buttons = container.querySelectorAll('button[aria-expanded]');

        for (const btn of buttons) {
          expect(btn.getAttribute('aria-expanded')).toBe('false');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('no accordion panel is visible on mount (all panels have aria-hidden="true")', () => {
    fc.assert(
      fc.property(policyArrayArb, (policies) => {
        fc.pre(policies.length > 0);

        const { container } = render(<AccordionPolicies policies={policies} />);
        const panels = container.querySelectorAll('[role="region"]');

        for (const panel of panels) {
          expect(panel.getAttribute('aria-hidden')).toBe('true');
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Deterministic edge cases ─────────────────────────────────────────────────

describe('Deterministic edge cases for AccordionPolicies', () => {
  it('empty policies array renders placeholder message', () => {
    const { container } = render(<AccordionPolicies policies={[]} />);
    expect(container.textContent).toContain('House rules coming soon.');

    // No accordion items should be rendered
    const buttons = container.querySelectorAll('button[aria-expanded]');
    expect(buttons.length).toBe(0);
  });

  it('single policy is rendered and can be toggled', async () => {
    const user = userEvent.setup();

    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Only Policy', body: 'Only body', order: 1 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const button = container.querySelector('button[aria-expanded]') as HTMLButtonElement;

    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('policies are sorted correctly when order values are [10, 5, 3, 7, 1]', () => {
    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Order 10', body: 'X', order: 10 },
      { _id: '2', branchId: 'b1', title: 'Order 5', body: 'Y', order: 5 },
      { _id: '3', branchId: 'b1', title: 'Order 3', body: 'Z', order: 3 },
      { _id: '4', branchId: 'b1', title: 'Order 7', body: 'W', order: 7 },
      { _id: '5', branchId: 'b1', title: 'Order 1', body: 'V', order: 1 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const buttons = container.querySelectorAll('button[aria-expanded]');
    const renderedTitles = Array.from(buttons).map((btn) => btn.textContent?.trim());

    expect(renderedTitles).toEqual(['Order 1', 'Order 3', 'Order 5', 'Order 7', 'Order 10']);
  });

  it('policy body text is rendered inside the expanded panel', async () => {
    const user = userEvent.setup();

    const policies: Policy[] = [
      {
        _id: '1',
        branchId: 'b1',
        title: 'Check-in Policy',
        body: 'Check-in time is 12:00 PM. Early check-in subject to availability.',
        order: 1,
      },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const button = container.querySelector('button[aria-expanded]') as HTMLButtonElement;

    // Panel should be collapsed initially (aria-expanded="false")
    expect(button.getAttribute('aria-expanded')).toBe('false');

    // Click to expand
    await user.click(button);

    // Panel should now be expanded (aria-expanded="true")
    expect(button.getAttribute('aria-expanded')).toBe('true');

    // Panel body should now be visible
    expect(container.textContent).toContain('Check-in time is 12:00 PM');
    expect(container.textContent).toContain('Early check-in subject to availability');
  });

  it('clicking through all items maintains exclusivity throughout', async () => {
    const user = userEvent.setup();

    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'A', body: 'Body A', order: 1 },
      { _id: '2', branchId: 'b1', title: 'B', body: 'Body B', order: 2 },
      { _id: '3', branchId: 'b1', title: 'C', body: 'Body C', order: 3 },
      { _id: '4', branchId: 'b1', title: 'D', body: 'Body D', order: 4 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const buttons = Array.from(
      container.querySelectorAll('button[aria-expanded]'),
    ) as HTMLButtonElement[];

    // Click through each button and verify only one is expanded at each step
    for (let i = 0; i < buttons.length; i++) {
      await user.click(buttons[i]);

      const expandedButtons = buttons.filter(
        (btn) => btn.getAttribute('aria-expanded') === 'true',
      );

      expect(expandedButtons.length).toBe(1);
      expect(expandedButtons[0]).toBe(buttons[i]);
    }
  });

  it('policies with order=0 are valid and appear first', () => {
    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Order 0', body: 'X', order: 0 },
      { _id: '2', branchId: 'b1', title: 'Order 1', body: 'Y', order: 1 },
      { _id: '3', branchId: 'b1', title: 'Order 5', body: 'Z', order: 5 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const buttons = container.querySelectorAll('button[aria-expanded]');
    const firstTitle = buttons[0].textContent?.trim();

    expect(firstTitle).toBe('Order 0');
  });

  it('large order values (>100) are handled correctly', () => {
    const policies: Policy[] = [
      { _id: '1', branchId: 'b1', title: 'Order 999', body: 'X', order: 999 },
      { _id: '2', branchId: 'b1', title: 'Order 1', body: 'Y', order: 1 },
      { _id: '3', branchId: 'b1', title: 'Order 500', body: 'Z', order: 500 },
    ];

    const { container } = render(<AccordionPolicies policies={policies} />);
    const buttons = container.querySelectorAll('button[aria-expanded]');
    const renderedTitles = Array.from(buttons).map((btn) => btn.textContent?.trim());

    expect(renderedTitles).toEqual(['Order 1', 'Order 500', 'Order 999']);
  });
});
