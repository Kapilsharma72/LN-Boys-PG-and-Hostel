/**
 * lib/notifications/email.ts
 *
 * Email notification client (SMTP via Nodemailer) for lead notifications.
 * This is the fallback used when the WhatsApp API call fails.
 *
 * Requirements: 9.5
 *
 * Exported function:
 *   - sendEmailNotification(lead) — emails the owner when a new Lead is saved
 *
 * Catches all errors and returns false without throwing, so callers can
 * safely handle the failure without crashing.
 */

import nodemailer from 'nodemailer';
import type { LeadData } from './whatsapp';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sends a formatted HTML email to the owner (OWNER_EMAIL) with lead details.
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, OWNER_EMAIL
 *
 * Returns true on success, false on any error (config missing, SMTP failure,
 * etc.). Never throws.
 *
 * Satisfies Requirement 9.5 (email fallback for lead notification).
 */
export async function sendEmailNotification(lead: LeadData): Promise<boolean> {
  try {
    const host = process.env.SMTP_HOST;
    const portStr = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const ownerEmail = process.env.OWNER_EMAIL;

    if (!host || !portStr || !user || !pass || !ownerEmail) {
      console.error(
        '[email] Missing one or more required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, OWNER_EMAIL'
      );
      return false;
    }

    const port = parseInt(portStr, 10);
    if (isNaN(port)) {
      console.error(`[email] SMTP_PORT is not a valid number: "${portStr}"`);
      return false;
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      auth: {
        user,
        pass,
      },
    });

    const intentLabel = lead.intent === 'visit' ? 'Schedule a Visit' : 'Reserve Now';

    const preferredDateRow =
      lead.preferredDate
        ? `<tr>
              <td style="padding:6px 12px;font-weight:600;color:#374151;">Preferred Date</td>
              <td style="padding:6px 12px;color:#111827;">${new Date(lead.preferredDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
           </tr>`
        : '';

    const whatsappRow = `
      <tr>
        <td style="padding:6px 12px;font-weight:600;color:#374151;">WhatsApp Opt-in</td>
        <td style="padding:6px 12px;color:#111827;">${lead.whatsappOptIn ? 'Yes ✓' : 'No'}</td>
      </tr>`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Lead Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1d4ed8;padding:24px 32px;">
              <h1 style="margin:0;font-size:20px;color:#ffffff;">📋 New Lead Received</h1>
              <p style="margin:4px 0 0;font-size:14px;color:#bfdbfe;">${intentLabel}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
                A new enquiry has been submitted on the LN Boys PG website.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                <tr style="background-color:#f3f4f6;">
                  <td style="padding:6px 12px;font-weight:600;color:#374151;">Name</td>
                  <td style="padding:6px 12px;color:#111827;">${escapeHtml(lead.name)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px;font-weight:600;color:#374151;">Mobile</td>
                  <td style="padding:6px 12px;color:#111827;">${escapeHtml(lead.mobile)}</td>
                </tr>
                <tr style="background-color:#f3f4f6;">
                  <td style="padding:6px 12px;font-weight:600;color:#374151;">Branch</td>
                  <td style="padding:6px 12px;color:#111827;">${escapeHtml(lead.branchId)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px;font-weight:600;color:#374151;">Intent</td>
                  <td style="padding:6px 12px;color:#111827;">${intentLabel}</td>
                </tr>
                ${preferredDateRow}
                ${whatsappRow}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f3f4f6;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated notification from LN Boys PG Hostel website.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transport.sendMail({
      from: `"LN Boys PG" <${user}>`,
      to: ownerEmail,
      subject: `New Lead: ${lead.name} — ${intentLabel}`,
      html: htmlBody,
    });

    return true;
  } catch (err) {
    console.error('[email] sendEmailNotification failed:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escapes HTML special characters to prevent XSS in the email body. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
