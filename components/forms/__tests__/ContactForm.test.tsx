/**
 * ContactForm integration tests.
 *
 * Validates:
 *   - Field rendering and dropdown with active branches
 *   - Form submission to POST /api/leads with source: "contact-form"
 *   - Success state without form reset (requirement 6.3)
 *   - Error handling with field preservation (requirement 6.4)
 *   - "general" fallback branchId when no branch selected
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from '../ContactForm';

// Helper to fill a text input and trigger blur validation
function fillAndBlur(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
  fireEvent.blur(element);
}

describe('ContactForm', () => {
  const mockBranches = [
    { branchId: 'ln-vidhani-jecrc', name: 'LN Vidhani (JECRC)' },
    { branchId: 'ln-jagatpura', name: 'LN Jagatpura' },
  ];

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────

  it('renders all required fields and the submit button', () => {
    render(<ContactForm activeBranches={mockBranches} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mobile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/branch of interest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('renders branch dropdown with active branch options', () => {
    render(<ContactForm activeBranches={mockBranches} />);

    expect(screen.getByRole('option', { name: 'LN Vidhani (JECRC)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'LN Jagatpura' })).toBeInTheDocument();
  });

  it('renders dropdown as disabled with placeholder when no branches are available', () => {
    render(<ContactForm activeBranches={[]} />);

    const dropdown = screen.getByLabelText(/branch of interest/i);
    expect(dropdown).toBeDisabled();
    expect(screen.getByRole('option', { name: /no active branches available/i })).toBeInTheDocument();
  });

  // ─── Validation ────────────────────────────────────────────────────────────

  it('shows name required error on blur with empty value', async () => {
    render(<ContactForm activeBranches={mockBranches} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.focus(nameInput);
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('shows mobile format error on blur with invalid value', async () => {
    render(<ContactForm activeBranches={mockBranches} />);

    fillAndBlur(screen.getByLabelText(/mobile/i), '12345');

    await waitFor(() => {
      expect(screen.getByText(/valid 10-digit indian mobile/i)).toBeInTheDocument();
    });
  });

  it('does not show mobile error for valid 10-digit number starting with 6–9', async () => {
    render(<ContactForm activeBranches={mockBranches} />);

    fillAndBlur(screen.getByLabelText(/mobile/i), '9123456789');

    await waitFor(() => {
      expect(screen.queryByText(/valid 10-digit indian mobile/i)).not.toBeInTheDocument();
    });
  });

  it('shows message length error when message exceeds 500 characters', async () => {
    render(<ContactForm activeBranches={mockBranches} />);

    fillAndBlur(screen.getByLabelText(/message/i), 'a'.repeat(501));

    await waitFor(() => {
      expect(screen.getByText(/message must be at most 500 characters/i)).toBeInTheDocument();
    });
  });

  // ─── Submission ────────────────────────────────────────────────────────────

  it('submits with correct payload including source: contact-form', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: { id: 'lead-abc' } }),
    });
    global.fetch = mockFetch;

    render(<ContactForm activeBranches={mockBranches} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/mobile/i), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByLabelText(/branch of interest/i), {
      target: { value: 'ln-vidhani-jecrc' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Interested in a room' },
    });

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leads',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            mobile: '9876543210',
            branchId: 'ln-vidhani-jecrc',
            intent: 'visit',
            source: 'contact-form',
            whatsappOptIn: false,
          }),
        })
      );
    });
  });

  it('uses "general" as fallback branchId when no branch is selected', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(<ContactForm activeBranches={mockBranches} />);

    // Only fill required fields; leave branch at default (empty)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alice Brown' } });
    fireEvent.change(screen.getByLabelText(/mobile/i), { target: { value: '7654321098' } });

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }));

    await waitFor(() => {
      const body = JSON.parse(
        (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string
      );
      expect(body.branchId).toBe('general');
      expect(body.source).toBe('contact-form');
    });
  });

  // ─── Success state (requirement 6.3) ───────────────────────────────────────

  it('displays success banner without resetting field values on success (requirement 6.3)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ContactForm activeBranches={mockBranches} />);

    const nameInput = screen.getByLabelText(/name/i);
    const mobileInput = screen.getByLabelText(/mobile/i);

    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    fireEvent.change(mobileInput, { target: { value: '9123456789' } });

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }));

    await waitFor(() => {
      expect(screen.getByText(/thank you.*received your message/i)).toBeInTheDocument();
    });

    // Fields must NOT be reset (requirement 6.3)
    expect(nameInput).toHaveValue('Jane Smith');
    expect(mobileInput).toHaveValue('9123456789');
  });

  // ─── Error state (requirement 6.4) ─────────────────────────────────────────

  it('shows "Something went wrong" message on network error and preserves field values (requirement 6.4)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    render(<ContactForm activeBranches={mockBranches} />);

    const nameInput = screen.getByLabelText(/name/i);
    const mobileInput = screen.getByLabelText(/mobile/i);

    fireEvent.change(nameInput, { target: { value: 'Bob Wilson' } });
    fireEvent.change(mobileInput, { target: { value: '8765432109' } });

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong.*try again/i)).toBeInTheDocument();
    });

    // Values preserved (requirement 6.4)
    expect(nameInput).toHaveValue('Bob Wilson');
    expect(mobileInput).toHaveValue('8765432109');
  });

  it('shows "Something went wrong" on non-409 server error and preserves values', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: 'Internal server error' }),
    });

    render(<ContactForm activeBranches={mockBranches} />);

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/mobile/i), { target: { value: '6123456789' } });

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong.*try again/i)).toBeInTheDocument();
    });

    expect(nameInput).toHaveValue('Test User');
  });

  it('shows duplicate enquiry message on 409 without resetting fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: 'We already received your enquiry. Our team will contact you shortly.',
      }),
    });

    render(<ContactForm activeBranches={mockBranches} />);

    const nameInput = screen.getByLabelText(/name/i);
    const mobileInput = screen.getByLabelText(/mobile/i);

    fireEvent.change(nameInput, { target: { value: 'Duplicate User' } });
    fireEvent.change(mobileInput, { target: { value: '6543210987' } });

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }));

    await waitFor(() => {
      expect(screen.getByText(/already received your enquiry/i)).toBeInTheDocument();
    });

    expect(nameInput).toHaveValue('Duplicate User');
    expect(mobileInput).toHaveValue('6543210987');
  });

  // ─── Spinner and disabled state during submission ───────────────────────────

  it('disables submit button and shows spinner while submitting', async () => {
    let resolveSubmit!: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });
    global.fetch = vi.fn().mockReturnValue(pendingPromise);

    render(<ContactForm activeBranches={mockBranches} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Spinner Test' } });
    fireEvent.change(screen.getByLabelText(/mobile/i), { target: { value: '9999999999' } });

    fireEvent.submit(screen.getByRole('form', { name: /contact form/i }));

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
    });

    // Clean up
    resolveSubmit({
      ok: true,
      json: async () => ({ success: true }),
    });
  });
});
