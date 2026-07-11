import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from '@/lib/db/mongoose';
import Gallery from '@/lib/db/models/Gallery';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

// Ensure the cloudinary singleton is configured by importing the helper module.
// lib/cloudinary.ts calls cloudinary.config() on first import — subsequent
// imports (including this one) reuse the already-configured instance.
import '@/lib/cloudinary';

/**
 * DELETE /api/branches/[id]/gallery/[gId]
 *
 * Admin-only route to delete a gallery item.
 * Requires CSRF token validation.
 *
 * Steps:
 *  1. Auth + CSRF checks
 *  2. Find Gallery document by { _id: gId, branchId: id }
 *  3. If not found → 404
 *  4. Delete from Cloudinary (best-effort; log error on failure but continue)
 *  5. Delete from MongoDB
 *  6. Return 200 { success: true, data: { deleted: true } }
 *
 * Requirements: 11.2
 *
 * @param params - Route params containing branchId (id) and gId
 * @returns 200 with { success: true, data: { deleted: true } }
 * @returns 401 with { success: false, error: "Unauthorized" }
 * @returns 403 with { success: false, error: "Invalid CSRF token" }
 * @returns 404 with { success: false, error: "Gallery item not found" }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; gId: string } }
) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (!session.adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // CSRF token validation
    const csrfHeader = request.headers.get('X-CSRF-Token');
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get('csrf-token')?.value;

    if (!validateCsrfToken(csrfHeader, csrfCookie)) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Connect to database and look up the gallery item
    await connectDB();
    const gallery = await Gallery.findOne({
      _id: params.gId,
      branchId: params.id,
    });

    if (!gallery) {
      return NextResponse.json(
        { success: false, error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary (best-effort — failure should not block DB delete)
    try {
      await cloudinary.uploader.destroy(gallery.publicId, {
        resource_type: gallery.resourceType,
      });
    } catch (cloudinaryError) {
      // Log and continue — MongoDB record must still be removed
      console.error(
        `[DELETE /api/branches/${params.id}/gallery/${params.gId}] Cloudinary delete failed for publicId "${gallery.publicId}":`,
        cloudinaryError
      );
    }

    // Delete from MongoDB
    await Gallery.findByIdAndDelete(params.gId);

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[DELETE /api/branches/${params.id}/gallery/${params.gId}] Error:`,
      error
    );

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
