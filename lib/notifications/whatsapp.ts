/**
 * lib/notifications/whatsapp.ts
 *
 * WhatsApp Business Cloud API client for lead notifications and auto-replies.
 *
 * Requirements: 9.5, 9.6
 *
 * Two exported functions:
 *   - sendLeadNotification(lead)  — notifies the owner when a new Lead is saved
 *   - sendAutoReply(mobile, name, branchName) — confirms the visitor's enquiry
 *
 * Both functions catch all errors and return false without throwing,
 * so callers can safely fall back to email (see notifications/email.ts).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LeadData {
  name: string;
  mobile: string;
  intent: 'visit' | 'reserve';
  branchId: string;
  preferredDate?: Date | null;
  whatsappOptIn: boolean;
}

interface WhatsAppTextPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the WhatsApp Business Cloud API endpoint URL.
 * Throws if WA_PHONE_NUMBER_ID is not configured — callers catch this.
 */
function getApiUrl(): string {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    throw new Error('WA_PHONE_NUMBER_ID environment variable is not set');
  }
  return `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
}

/**
 * Normalises a 10-digit Indian mobile number to the E.164 format expected
 * by the WhatsApp API (e.g. "9876543210" → "919876543210").
 * If the number already starts with "91" (country code), it is left as-is.
 * A leading "+" is stripped because the Meta API expects digits only.
 */
function normaliseIndianMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits; // unexpected format — pass through and let the API validate
}

/**
 * Sends a text message via the WhatsApp Business Cloud API.
 * Returns true on HTTP 2xx, false on any non-2xx or network error.
 */
async function sendTextMessage(to: string, body: string): Promise<boolean> {
  const accessToken = process.env.WA_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('[whatsapp] WA_ACCESS_TOKEN environment variable is not set');
    return false;
  }

  const url = getApiUrl();
  const payload: WhatsAppTextPayload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(unreadable body)');
    console.error(
      `[whatsapp] API returned ${response.status} ${response.statusText}. Body: ${errorBody}`
    );
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a Lead_Notification to the owner's WhatsApp number.
 *
 * The owner's number is read from the OWNER_WHATSAPP environment variable.
 * Returns true on success (2xx), false on any error (network or non-2xx).
 *
 * Satisfies Requirement 9.5.
 */
export async function sendLeadNotification(lead: LeadData): Promise<boolean> {
  try {
    const ownerWhatsApp = process.env.OWNER_WHATSAPP;
    if (!ownerWhatsApp) {
      console.error('[whatsapp] OWNER_WHATSAPP environment variable is not set');
      return false;
    }

    const to = normaliseIndianMobile(ownerWhatsApp);

    const intentLabel = lead.intent === 'visit' ? 'Schedule a Visit' : 'Reserve Now';
    const dateLine =
      lead.preferredDate
        ? `\nPreferred Date: ${new Date(lead.preferredDate).toLocaleDateString('en-IN')}`
        : '';
    const whatsappLine = lead.whatsappOptIn ? '\nWhatsApp Opt-in: Yes' : '';

    const messageBody =
      `📋 *New Lead — ${intentLabel}*\n\n` +
      `Name: ${lead.name}\n` +
      `Mobile: ${lead.mobile}\n` +
      `Branch: ${lead.branchId}` +
      dateLine +
      whatsappLine;

    return await sendTextMessage(to, messageBody);
  } catch (err) {
    console.error('[whatsapp] sendLeadNotification failed:', err);
    return false;
  }
}

/**
 * Sends an Auto_Reply to the visitor's WhatsApp when whatsappOptIn is true.
 *
 * Message contains the visitor's name, branch name, and the standard
 * acknowledgement text "We'll contact you within 2 hours."
 *
 * Returns true on success (2xx), false on any error (network or non-2xx).
 *
 * Satisfies Requirement 9.6.
 */
export async function sendAutoReply(
  mobile: string,
  name: string,
  branchName: string
): Promise<boolean> {
  try {
    const to = normaliseIndianMobile(mobile);

    const messageBody =
      `Hi ${name}! 👋\n\n` +
      `Thank you for your enquiry about *${branchName}*.\n\n` +
      `We'll contact you within 2 hours.`;

    return await sendTextMessage(to, messageBody);
  } catch (err) {
    console.error('[whatsapp] sendAutoReply failed:', err);
    return false;
  }
}
