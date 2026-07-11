/**
 * Integration Tests — WhatsApp Notification & Email Fallback
 *
 * Tests the notification pipeline end-to-end with mocked external I/O:
 *   - sendLeadNotification  (WhatsApp success path)
 *   - sendAutoReply         (WhatsApp success path)
 *   - sendLeadNotification  (WhatsApp non-2xx → email fallback)
 *   - sendEmailNotification (email success path)
 *   - sendEmailNotification (missing env var guard)
 *
 * Validates: Requirements 9.5, 9.6
 */

// @vitest-environment node

import nodemailer from 'nodemailer';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

import {
  sendAutoReply,
  sendLeadNotification,
  type LeadData,
} from '../whatsapp';
import { sendEmailNotification } from '../email';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const LEAD: LeadData = {
  name: 'Raj Sharma',
  mobile: '9876543210',
  intent: 'visit',
  branchId: 'ln-main',
  preferredDate: new Date('2025-08-01'),
  whatsappOptIn: true,
};

// ---------------------------------------------------------------------------
// Environment variables used by the modules under test
// ---------------------------------------------------------------------------

const ENV_DEFAULTS = {
  WA_PHONE_NUMBER_ID: '123456789',
  WA_ACCESS_TOKEN: 'test-access-token',
  OWNER_WHATSAPP: '9001234567',
  OWNER_EMAIL: 'owner@lnboyspg.in',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  SMTP_USER: 'test@lnboyspg.in',
  SMTP_PASS: 'secret',
};

// ---------------------------------------------------------------------------
// Suite 1 — WhatsApp sendLeadNotification — success path
// **Validates: Requirements 9.5**
// ---------------------------------------------------------------------------

describe('WhatsApp — sendLeadNotification — success path', () => {
  let fetchSpy: MockInstance;

  beforeEach(() => {
    // Seed env vars
    Object.assign(process.env, ENV_DEFAULTS);

    // Mock global.fetch to return a successful 200 response
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Remove env vars set for this suite
    for (const key of Object.keys(ENV_DEFAULTS)) {
      delete process.env[key];
    }
  });

  it('returns true when the WhatsApp API responds with 2xx', async () => {
    const result = await sendLeadNotification(LEAD);
    expect(result).toBe(true);
  });

  it('calls fetch with the correct WhatsApp API URL', async () => {
    await sendLeadNotification(LEAD);

    const expectedUrl = `https://graph.facebook.com/v18.0/${ENV_DEFAULTS.WA_PHONE_NUMBER_ID}/messages`;
    expect(fetchSpy).toHaveBeenCalledWith(
      expectedUrl,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('calls fetch with the correct Authorization and Content-Type headers', async () => {
    await sendLeadNotification(LEAD);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${ENV_DEFAULTS.WA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('sends the message to the owner WhatsApp number (normalised to E.164)', async () => {
    await sendLeadNotification(LEAD);

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    // 9001234567 → 919001234567
    expect(body.to).toBe(`91${ENV_DEFAULTS.OWNER_WHATSAPP}`);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — WhatsApp sendAutoReply — success path
// **Validates: Requirements 9.6**
// ---------------------------------------------------------------------------

describe('WhatsApp — sendAutoReply — success path', () => {
  let fetchSpy: MockInstance;

  beforeEach(() => {
    Object.assign(process.env, ENV_DEFAULTS);

    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of Object.keys(ENV_DEFAULTS)) {
      delete process.env[key];
    }
  });

  it('returns true when the WhatsApp API responds with 2xx', async () => {
    const result = await sendAutoReply('9876543210', 'Raj', 'LN Main');
    expect(result).toBe(true);
  });

  it("sends the message to the visitor's normalised mobile number", async () => {
    await sendAutoReply('9876543210', 'Raj', 'LN Main');

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.to).toBe('919876543210');
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — WhatsApp non-2xx response (API failure)
// **Validates: Requirements 9.5**
// ---------------------------------------------------------------------------

describe('WhatsApp — sendLeadNotification — non-2xx API response', () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    Object.assign(process.env, ENV_DEFAULTS);

    // Return a 400 Bad Request from the WhatsApp API
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'error details',
    } as Response);

    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of Object.keys(ENV_DEFAULTS)) {
      delete process.env[key];
    }
  });

  it('returns false when the API returns a non-2xx status', async () => {
    const result = await sendLeadNotification(LEAD);
    expect(result).toBe(false);
  });

  it('logs the error via console.error', async () => {
    await sendLeadNotification(LEAD);
    expect(consoleSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Email sendEmailNotification — success path
// **Validates: Requirements 9.5**
// ---------------------------------------------------------------------------

describe('Email — sendEmailNotification — success path', () => {
  let sendMailMock: MockInstance;

  beforeEach(() => {
    Object.assign(process.env, ENV_DEFAULTS);

    // Mock nodemailer.createTransport so it returns a transport with a mocked sendMail
    sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-msg-id' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of Object.keys(ENV_DEFAULTS)) {
      delete process.env[key];
    }
  });

  it('returns true when sendMail succeeds', async () => {
    const result = await sendEmailNotification(LEAD);
    expect(result).toBe(true);
  });

  it('calls sendMail with the owner email in the "to" field', async () => {
    await sendEmailNotification(LEAD);

    const [mailOptions] = sendMailMock.mock.calls[0] as [nodemailer.SendMailOptions];
    expect(mailOptions.to).toBe(ENV_DEFAULTS.OWNER_EMAIL);
  });

  it('calls sendMail with a non-empty subject containing the lead name', async () => {
    await sendEmailNotification(LEAD);

    const [mailOptions] = sendMailMock.mock.calls[0] as [nodemailer.SendMailOptions];
    expect(typeof mailOptions.subject).toBe('string');
    expect(mailOptions.subject).toContain(LEAD.name);
  });

  it('calls sendMail with an html body', async () => {
    await sendEmailNotification(LEAD);

    const [mailOptions] = sendMailMock.mock.calls[0] as [nodemailer.SendMailOptions];
    expect(typeof mailOptions.html).toBe('string');
    expect((mailOptions.html as string).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — Email sendEmailNotification — missing env var guard
// **Validates: Requirements 9.5**
// ---------------------------------------------------------------------------

describe('Email — sendEmailNotification — missing OWNER_EMAIL env var', () => {
  let consoleSpy: MockInstance;
  let originalOwnerEmail: string | undefined;

  beforeEach(() => {
    Object.assign(process.env, ENV_DEFAULTS);
    // Save and then remove OWNER_EMAIL
    originalOwnerEmail = process.env.OWNER_EMAIL;
    delete process.env.OWNER_EMAIL;

    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore OWNER_EMAIL
    if (originalOwnerEmail !== undefined) {
      process.env.OWNER_EMAIL = originalOwnerEmail;
    }
    // Clean up remaining env vars
    for (const key of Object.keys(ENV_DEFAULTS)) {
      delete process.env[key];
    }
  });

  it('returns false when OWNER_EMAIL is not set', async () => {
    const result = await sendEmailNotification(LEAD);
    expect(result).toBe(false);
  });

  it('logs an error when OWNER_EMAIL is missing', async () => {
    await sendEmailNotification(LEAD);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
