import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Lead from '@/lib/db/models/Lead';
import { LeadSchema } from '@/lib/validations/lead';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { sendLeadNotification, sendAutoReply } from '@/lib/notifications/whatsapp';
import { sendEmailNotification } from '@/lib/notifications/email';
import type { LeadData } from '@/lib/notifications/whatsapp';

/**
 * GET /api/leads
 *
 * Admin-only, paginated list of leads sorted newest-first.
 *
 * Requirements: 9.3, 13.6
 *
 * Query params:
 *   - page  (default: 1)
 *   - limit (default: 20, max: 100)
 *
 * @returns 200 { success: true, data: { leads, totalCount, page, limit } }
 * @returns 401 { success: false, error: "Unauthorized" }
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function GET(request: NextRequest) {
  try {
    // Auth guard — admin only
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse pagination query params
    const { searchParams } = request.nextUrl;
    const rawPage = parseInt(searchParams.get('page') ?? '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10);

    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;

    await connectDB();

    const [leads, totalCount] = await Promise.all([
      Lead.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(),
    ]);

    return NextResponse.json(
      { success: true, data: { leads, totalCount, page, limit } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/leads] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 *
 * Public endpoint to submit a new enquiry lead.
 * Steps:
 *   1. Body size check  (> 1 MB → 413)
 *   2. Rate limit check (IP-based sliding window → 429)
 *   3. Zod validation   (invalid body → 400)
 *   4. Dedup check      (same mobile + branch within 30 min → 409)
 *   5. Persist lead     (201)
 *   6. Fire-and-forget notifications (WhatsApp → email fallback, optional auto-reply)
 *
 * Requirements: 9.4, 9.5, 13.5
 *
 * @returns 201 { success: true, data: { id } }
 * @returns 400 { success: false, error: string }
 * @returns 409 { success: false, error: string }
 * @returns 413 { success: false, error: "Payload too large" }
 * @returns 429 { success: false, error: string }
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Body size check ────────────────────────────────────────────────
    const MAX_BODY_BYTES = 1_048_576; // 1 MB
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Payload too large' },
        { status: 413 }
      );
    }

    // ── 2. Rate limiting ──────────────────────────────────────────────────
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter) },
        }
      );
    }

    // ── 3. Parse & validate ───────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = LeadSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // ── 4. Dedup check (30-minute window) ─────────────────────────────────
    await connectDB();

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const duplicate = await Lead.findOne({
      mobile: data.mobile,
      branchId: data.branchId,
      createdAt: { $gte: thirtyMinutesAgo },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            'We already received your enquiry. Our team will contact you shortly.',
        },
        { status: 409 }
      );
    }

    // ── 5. Persist lead ───────────────────────────────────────────────────
    const lead = await Lead.create({
      ...data,
      status: 'new',
      source: data.source ?? 'enquiry-form',
    });

    // ── 6. Response first, then fire-and-forget notifications ─────────────
    const leadData: LeadData = {
      name: lead.name,
      mobile: lead.mobile,
      intent: lead.intent,
      branchId: lead.branchId,
      preferredDate: lead.preferredDate ?? null,
      whatsappOptIn: lead.whatsappOptIn,
    };

    // Notifications are intentionally not awaited — fire-and-forget
    void (async () => {
      const whatsappSent = await sendLeadNotification(leadData);
      if (!whatsappSent) {
        await sendEmailNotification(leadData);
      }

      if (data.whatsappOptIn) {
        await sendAutoReply(lead.mobile, lead.name, lead.branchId);
      }
    })();

    return NextResponse.json(
      { success: true, data: { id: lead._id } },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/leads] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
