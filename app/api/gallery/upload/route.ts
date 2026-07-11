import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Gallery from '@/lib/db/models/Gallery';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { cookies } from 'next/headers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

const VALID_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
]);

const VALID_CATEGORIES = ['room', 'common-area', 'food', 'exterior', 'event'] as const;
type GalleryCategory = typeof VALID_CATEGORIES[number];

/**
 * POST /api/gallery/upload
 *
 * Admin-only multipart upload endpoint for gallery media (images and videos).
 * Accepts a multipart/form-data body, validates the file and metadata, uploads
 * to Cloudinary, then saves a Gallery document to MongoDB.
 *
 * Requirements: 11.1, 11.2, 13.6
 *
 * Form fields:
 *   - file      (File, required)     — JPEG/PNG/WebP/MP4, max 50 MB
 *   - branchId  (string, required)   — branch this media belongs to
 *   - category  (string, required)   — one of room | common-area | food | exterior | event
 *   - altText   (string, required)   — accessibility description, 1–200 chars
 *
 * @returns 201 { success: true, data: GalleryDocument }
 * @returns 400 { success: false, error: string }  — missing/invalid fields
 * @returns 401 { success: false, error: "Unauthorized" }
 * @returns 403 { success: false, error: "Invalid CSRF token" }
 * @returns 413 { success: false, error: "File too large. Maximum size is 50 MB." }
 * @returns 500 { success: false, error: "Internal server error" }
 */
export async function POST(request: Request) {
  // -------------------------------------------------------------------------
  // 1. Authentication check
  // -------------------------------------------------------------------------
  const session = await getSession();
  if (!session.adminId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // -------------------------------------------------------------------------
  // 2. CSRF token validation
  // -------------------------------------------------------------------------
  const csrfHeader = request.headers.get('X-CSRF-Token');
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get('csrf-token')?.value;

  if (!validateCsrfToken(csrfHeader, csrfCookie)) {
    return NextResponse.json(
      { success: false, error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  try {
    // -----------------------------------------------------------------------
    // 3. Parse multipart form data
    // -----------------------------------------------------------------------
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to parse multipart form data.' },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // 4. Extract and validate required fields
    // -----------------------------------------------------------------------
    const file = formData.get('file');
    const branchId = formData.get('branchId');
    const category = formData.get('category');
    const altText = formData.get('altText');

    // Validate file presence and type
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: file.' },
        { status: 400 }
      );
    }

    // Validate branchId
    if (!branchId || typeof branchId !== 'string' || branchId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: branchId.' },
        { status: 400 }
      );
    }

    // Validate category
    if (
      !category ||
      typeof category !== 'string' ||
      !(VALID_CATEGORIES as readonly string[]).includes(category)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid or missing category. Must be one of: ${VALID_CATEGORIES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // Safe cast — validated above
    const validCategory = category as GalleryCategory;

    // Validate altText (1–200 chars)
    if (!altText || typeof altText !== 'string' || altText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: altText.' },
        { status: 400 }
      );
    }
    if (altText.length > 200) {
      return NextResponse.json(
        { success: false, error: 'altText must be 200 characters or fewer.' },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // 5. Validate MIME type
    // -----------------------------------------------------------------------
    if (!VALID_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type "${file.type}". Accepted types: image/jpeg, image/png, image/webp, video/mp4.`,
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // 6. Validate file size (≤ 50 MB)
    // -----------------------------------------------------------------------
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 50 MB.' },
        { status: 413 }
      );
    }

    // -----------------------------------------------------------------------
    // 7. Convert file to Buffer
    // -----------------------------------------------------------------------
    const buffer = Buffer.from(await file.arrayBuffer());

    // -----------------------------------------------------------------------
    // 8. Upload to Cloudinary
    // -----------------------------------------------------------------------
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(buffer, 'ln-hostel/gallery');
    } catch (cloudinaryError) {
      console.error('[POST /api/gallery/upload] Cloudinary upload failed:', cloudinaryError);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------------------
    // 9. Save Gallery document to MongoDB
    // -----------------------------------------------------------------------
    await connectDB();

    let galleryDoc;
    try {
      galleryDoc = await Gallery.create({
        branchId: branchId.trim(),
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        resourceType: cloudinaryResult.resource_type === 'video' ? 'video' : 'image',
        category: validCategory,
        altText: altText.trim(),
      });
    } catch (dbError) {
      console.error('[POST /api/gallery/upload] MongoDB save failed:', dbError);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------------------
    // 10. Return 201 with the created document
    // -----------------------------------------------------------------------
    return NextResponse.json(
      { success: true, data: galleryDoc },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/gallery/upload] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
