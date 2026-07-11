/**
 * Unit tests for components/ui/Accordion.tsx
 *
 * Covers:
 * - Rendering: items render with correct text and initial state
 * - Aria attributes: aria-expanded, aria-controls, aria-labelledby
 * - Toggle behaviour: click to expand, click again to collapse
 * - Exclusivity: only one item per group can be open at a time
 * - Keyboard: Escape closes the open item
 * - prefers-reduced-motion: motion-reduce classes are present on animated elements
 * - Exports: both named Accordion export and default export are the same
 * - defaultOpenId: specified item starts open
 *
 * Requirements: 7.4, 14.7
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Accordion, { Accordion as NamedAccordion } from './Accordion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleItems = [
  { id: 'item-1', title: 'Check-in Policy', content: <p>Check in between 8AM and 9PM.</p> },
  { id: 'item-2', title: 'Guest Policy', content: <p>Guests must register at reception.</p> },
  { id: 'item-3', title: 'Noise Policy', content: <p>Quiet hours after 10 PM.</p> },
];

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('Accordion — rendering', () => {
  it('renders all item titles', () => {
    render(<Accordion items={sampleItems} />);

    expect(screen.getByText('Check-in Policy')).toBeInTheDocument();
    expect(screen.getByText('Guest Policy')).toBeInTheDocument();
    expect(screen.getByText('Noise Policy')).toBeInTheDocument();
  });

  it('all items start collapsed by default', () => {
    render(<Accordion items={sampleItems} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('renders no visible content initially when no defaultOpenId', () => {
    render(<Accordion items={sampleItems} />);

    // Content exists in the DOM (for SSR) but panel is hidden
    const panels = screen.getAllByRole('region', { hidden: true });
    panels.forEach((panel) => {
      expect(panel).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('opens the item specified by defaultOpenId on mount', () => {
    render(<Accordion items={sampleItems} defaultOpenId="item-2" />);

    const guestButton = screen.getByRole('button', { name: /guest policy/i });
    expect(guestButton).toHaveAttribute('aria-expanded', 'true');

    // Other buttons stay closed
    const checkinButton = screen.getByRole('button', { name: /check-in policy/i });
    expect(checkinButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders zero items without crashing', () => {
    const { container } = render(<Accordion items={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ARIA attributes
// ---------------------------------------------------------------------------

describe('Accordion — ARIA attributes', () => {
  it('each trigger has aria-expanded=false initially', () => {
    render(<Accordion items={sampleItems} />);

    sampleItems.forEach(({ title }) => {
      const btn = screen.getByRole('button', { name: new RegExp(title, 'i') });
      expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('trigger aria-controls matches panel id', () => {
    render(<Accordion items={sampleItems} />);

    sampleItems.forEach(({ id, title }) => {
      const btn = screen.getByRole('button', { name: new RegExp(title, 'i') });
      const panelId = `accordion-panel-${id}`;
      expect(btn).toHaveAttribute('aria-controls', panelId);

      const panel = document.getElementById(panelId);
      expect(panel).toBeInTheDocument();
    });
  });

  it('panel aria-labelledby matches trigger id', () => {
    render(<Accordion items={sampleItems} />);

    sampleItems.forEach(({ id, title }) => {
      const btn = screen.getByRole('button', { name: new RegExp(title, 'i') });
      const triggerId = `accordion-trigger-${id}`;
      expect(btn).toHaveAttribute('id', triggerId);

      const panel = document.getElementById(`accordion-panel-${id}`);
      expect(panel).toHaveAttribute('aria-labelledby', triggerId);
    });
  });

  it('trigger buttons have type="button" to prevent unintentional form submission', () => {
    render(<Accordion items={sampleItems} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button');
    });
  });

  it('panels have role="region"', () => {
    render(<Accordion items={sampleItems} />);

    // All regions (including hidden ones)
    const regions = document.querySelectorAll('[role="region"]');
    expect(regions).toHaveLength(sampleItems.length);
  });
});

// ---------------------------------------------------------------------------
// Toggle behaviour
// ---------------------------------------------------------------------------

describe('Accordion — toggle behaviour', () => {
  it('clicking a trigger expands its panel', async () => {
    render(<Accordion items={sampleItems} />);

    const btn = screen.getByRole('button', { name: /check-in policy/i });
    fireEvent.click(btn);

    expect(btn).toHaveAttribute('aria-expanded', 'true');
    // Panel is no longer hidden
    const panel = document.getElementById('accordion-panel-item-1');
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });

  it('clicking an expanded trigger collapses it (toggle)', async () => {
    render(<Accordion items={sampleItems} />);

    const btn = screen.getByRole('button', { name: /check-in policy/i });

    // Open
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');

    // Close
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('panel content is visible when item is open', () => {
    render(<Accordion items={sampleItems} />);

    const btn = screen.getByRole('button', { name: /guest policy/i });
    fireEvent.click(btn);

    expect(screen.getByText('Guests must register at reception.')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Exclusivity — at most one item open per group
// ---------------------------------------------------------------------------

describe('Accordion — exclusivity', () => {
  it('opening a second item closes the first', () => {
    render(<Accordion items={sampleItems} />);

    const btn1 = screen.getByRole('button', { name: /check-in policy/i });
    const btn2 = screen.getByRole('button', { name: /guest policy/i });

    fireEvent.click(btn1);
    expect(btn1).toHaveAttribute('aria-expanded', 'true');
    expect(btn2).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn2);
    expect(btn1).toHaveAttribute('aria-expanded', 'false');
    expect(btn2).toHaveAttribute('aria-expanded', 'true');
  });

  it('at most one item is expanded at any time', () => {
    render(<Accordion items={sampleItems} />);

    const buttons = screen.getAllByRole('button');

    // Click each button in sequence and verify only one is expanded
    buttons.forEach((btn, idx) => {
      fireEvent.click(btn);

      const expanded = screen.getAllByRole('button').filter(
        (b) => b.getAttribute('aria-expanded') === 'true',
      );
      expect(expanded).toHaveLength(1);
      expect(expanded[0]).toBe(btn);
    });
  });

  it('two separate Accordion instances manage their own open state independently', () => {
    render(
      <>
        <Accordion items={[sampleItems[0], sampleItems[1]]} />
        <Accordion items={[sampleItems[2]]} />
      </>,
    );

    const buttons = screen.getAllByRole('button');
    // First accordion: open item-1
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');

    // Second accordion: open item-3 — should not affect first accordion
    fireEvent.click(buttons[2]);
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'true');

    // First accordion's state is unchanged
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('Accordion — keyboard navigation', () => {
  it('pressing Escape while a panel is open collapses it', () => {
    render(<Accordion items={sampleItems} />);

    const btn = screen.getByRole('button', { name: /noise policy/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(btn, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('pressing Escape on a closed item has no effect', () => {
    render(<Accordion items={sampleItems} />);

    const btn = screen.getByRole('button', { name: /check-in policy/i });
    // Not open — Escape should not crash or change state
    fireEvent.keyDown(btn, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});

// ---------------------------------------------------------------------------
// prefers-reduced-motion
// ---------------------------------------------------------------------------

describe('Accordion — prefers-reduced-motion classes', () => {
  it('animated panel wrapper includes motion-reduce:transition-none class', () => {
    render(<Accordion items={sampleItems} />);

    // The animated wrapper div is the direct child of the item div that wraps the panel
    const panelWrapper = document.getElementById('accordion-panel-item-1');
    expect(panelWrapper?.className).toContain('motion-reduce:transition-none');
    expect(panelWrapper?.className).toContain('motion-reduce:duration-0');
  });

  it('chevron SVG includes motion-reduce:transition-none class', () => {
    render(<Accordion items={sampleItems} />);

    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    svgs.forEach((svg) => {
      // In jsdom, SVGElement.className is an SVGAnimatedString; getAttribute gives
      // us the raw class string as a plain string regardless of environment.
      const classAttr = svg.getAttribute('class') ?? '';
      expect(classAttr).toContain('motion-reduce:transition-none');
    });
  });
});

// ---------------------------------------------------------------------------
// Focus indicator
// ---------------------------------------------------------------------------

describe('Accordion — focus indicator', () => {
  it('trigger buttons have focus-visible:outline-2 class for visible focus ring', () => {
    render(<Accordion items={sampleItems} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('focus-visible:outline-2');
      // Gold colour (#F5C518) for WCAG 3:1 contrast on navy background
      expect(btn.className).toContain('focus-visible:outline-[#F5C518]');
    });
  });
});

// ---------------------------------------------------------------------------
// Named and default exports
// ---------------------------------------------------------------------------

describe('Accordion — exports', () => {
  it('default export and named export are the same component', () => {
    expect(Accordion).toBe(NamedAccordion);
  });
});

// ---------------------------------------------------------------------------
// Custom className props
// ---------------------------------------------------------------------------

describe('Accordion — custom class props', () => {
  it('applies className to the root wrapper', () => {
    const { container } = render(
      <Accordion items={sampleItems} className="my-custom-class" />,
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('applies itemClassName to each item wrapper', () => {
    render(<Accordion items={sampleItems} itemClassName="item-wrapper" />);

    const wrappers = document.querySelectorAll('.item-wrapper');
    expect(wrappers).toHaveLength(sampleItems.length);
  });

  it('applies triggerClassName to each trigger button', () => {
    render(<Accordion items={sampleItems} triggerClassName="custom-trigger" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn.className).toContain('custom-trigger');
    });
  });
});
