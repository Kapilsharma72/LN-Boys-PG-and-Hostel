// @vitest-environment node

/**
 * Integration tests for app/api/gallery/upload/route.ts
 *
 * Property 19: Gallery round-trip — uploaded item metadata is stored and
 * retrievable with all fields intact.
 *
 * Validates: Requirements 11.2, 11.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mock functions so they can be referenced in vi.mock factories
// (vi.mock calls are hoisted by Vitest, so factory closures cannot close over
//  regular `const` declarations at module scope)
// ---------------------------------------------------------------------------
const {
  mockGetSession,
  mockValidateCsrfToken,
  mockGalleryCreate,
  mockUploadToCloudinary,
  mockCookies,
} = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockValidateCsrfToken = vi.fn();
  const mockGalleryCreate = vi.fn();
  const mockUploadToCloudinary = vi.fn();
  const mockCookies = vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'valid-csrf-token' }),
  });
  return {
    mockGetSession,
    mockValidateCsrfToken,
    mockGalleryCreate,
    mockUploadToCloudinary,
    mockCookies,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: mockGetSession,
}));

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: mockValidateCsrfToken,
}));

vi.mock('@/lib/db/mongoose', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/models/Gallery', () => ({
  default: { create: mockGalleryCreate },
}));

vi.mock('@/lib/cloudinary', () => ({
  uploadToCloudinary: mockUploadToCloudinary,
}));

// ---------------------------------------------------------------------------
// Import route handler AFTER mocks are in place
// ---------------------------------------------------------------------------
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CSRF_TOKEN = 'valid-csrf-token';
const BASE_URL = 'http://localhost:3000/api/gallery/upload';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Create a File object with a given MIME type.
 * If sizeBytesOverride is provided the file has that exact byte length (zeros).
 */
function makeFile(
  name = 'test.jpg',
  type = 'image/jpeg',
  sizeBytesOverride?: number
): File {
  const buf =
    sizeBytesOverride !== undefined
      ? new Uint8Array(sizeBytesOverride)
      : new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // minimal JPEG header
  return new File([buf], name, { type });
}

/**
 * Build a multipart Request with the given form fields.
 * Passing `null` for a field omits it from FormData.
 */
function buildRequest(
  fields: {
    file?: File | null;
    branchId?: string | null;
    category?: string | null;
    altText?: string | null;
  },
  csrfToken = CSRF_TOKEN
): Request {
  const fd = new FormData();
  if (fields.file != null) fd.append('file', fields.file);
  if (fields.branchId != null) fd.append('branchId', fields.branchId);
  if (fields.category != null) fd.append('category', fields.category);
  if (fields.altText != null) fd.append('altText', fields.altText);

  return new Request(BASE_URL, {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
    body: fd,
  });
}

/** Default valid upload fields for image */
const VALID_FIELDS = {
  file: makeFile('photo.jpg', 'image/jpeg'),
  branchId: 'ln-vidhani',
  category: 'room',
  altText: 'A comfortable single room',
};

/** Default Cloudinary response for an image upload */
const CLOUDINARY_IMAGE_RESPONSE = {
  secure_url:
    'https://res.cloudinary.com/demo/image/upload/v1/ln-hostel/gallery/photo.jpg',
  public_id: 'ln-hostel/gallery/photo',
  resource_type: 'image',
  url: 'http://res.cloudinary.com/demo/image/upload/v1/ln-hostel/gallery/photo.jpg',
  format: 'jpg',
  width: 800,
  height: 600,
  bytes: 4,
};

/** Default Gallery document returned by Gallery.create */
const GALLERY_DOC = {
  _id: 'gallery-doc-id',
  branchId: 'ln-vidhani',
  url: CLOUDINARY_IMAGE_RESPONSE.secure_url,
  publicId: CLOUDINARY_IMAGE_RESPONSE.public_id,
  resourceType: 'image',
  category: 'room',
  altText: 'A comfortable single room',
  uploadedAt: new Date(),
};

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Authenticated admin session
  mockGetSession.mockResolvedValue({ adminId: 'admin' });

  // Valid CSRF
  mockValidateCsrfToken.mockReturnValue(true);

  // Cookies mock
  mockCookies.mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: CSRF_TOKEN }),
  });

  // Cloudinary returns an image result by default
  mockUploadToCloudinary.mockResolvedValue(CLOUDINARY_IMAGE_RESPONSE);

  // Gallery.create returns the doc
  mockGalleryCreate.mockResolvedValue(GALLERY_DOC);
});

// ---------------------------------------------------------------------------
// Property 19a — Successful upload stores all metadata fields
// ---------------------------------------------------------------------------

describe('Property 19a — Successful upload stores all metadata fields', () => {
  /**
   * Validates: Requirements 11.2, 11.3
   *
   * When a valid image is uploaded, the handler must:
   * 1. Call uploadToCloudinary with a Buffer
   * 2. Call Gallery.create with all fields derived from the Cloudinary response
   *    and form data: { branchId, url (secure_url), publicId (public_id),
   *    resourceType, category, altText }
   * 3. Return 201 with the created document inside { success, data }
   */
  it('returns 201 and calls Gallery.create with all required fields', async () => {
    const request = buildRequest(VALID_FIELDS);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();

    expect(mockGalleryCreate).toHaveBeenCalledOnce();
    expect(mockGalleryCreate).toHaveBeenCalledWith({
      branchId: 'ln-vidhani',
      url: CLOUDINARY_IMAGE_RESPONSE.secure_url,
      publicId: CLOUDINARY_IMAGE_RESPONSE.public_id,
      resourceType: 'image',
      category: 'room',
      altText: 'A comfortable single room',
    });
  });

  it('passes a Buffer to uploadToCloudinary with the gallery folder', async () => {
    const request = buildRequest(VALID_FIELDS);
    await POST(request);

    expect(mockUploadToCloudinary).toHaveBeenCalledOnce();
    const [fileArg, folderArg] = mockUploadToCloudinary.mock.calls[0];
    expect(Buffer.isBuffer(fileArg)).toBe(true);
    expect(folderArg).toBe('ln-hostel/gallery');
  });

  it('trims whitespace from branchId and altText before saving', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      branchId: '  ln-vidhani  ',
      altText: '  A comfortable single room  ',
    });
    await POST(request);

    expect(mockGalleryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        branchId: 'ln-vidhani',
        altText: 'A comfortable single room',
      })
    );
  });

  it('response envelope has success:true and data, but no error field', async () => {
    const request = buildRequest(VALID_FIELDS);
    const response = await POST(request);
    const body = await response.json();

    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('data');
    expect(body).not.toHaveProperty('error');
  });

  it('stores all valid categories', async () => {
    const categories = ['room', 'common-area', 'food', 'exterior', 'event'] as const;

    for (const cat of categories) {
      vi.clearAllMocks();
      mockGetSession.mockResolvedValue({ adminId: 'admin' });
      mockValidateCsrfToken.mockReturnValue(true);
      mockCookies.mockResolvedValue({ get: vi.fn().mockReturnValue({ value: CSRF_TOKEN }) });
      mockUploadToCloudinary.mockResolvedValue(CLOUDINARY_IMAGE_RESPONSE);
      mockGalleryCreate.mockResolvedValue({ ...GALLERY_DOC, category: cat });

      const request = buildRequest({ ...VALID_FIELDS, category: cat });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockGalleryCreate).toHaveBeenCalledWith(
        expect.objectContaining({ category: cat })
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Property 19b — Video upload uses resource_type 'video'
// ---------------------------------------------------------------------------

describe('Property 19b — Video upload stores resourceType as "video"', () => {
  /**
   * Validates: Requirement 11.2
   *
   * When Cloudinary returns resource_type 'video', Gallery.create must be
   * called with resourceType: 'video'.
   */
  it('passes resourceType:"video" to Gallery.create for video uploads', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      secure_url:
        'https://res.cloudinary.com/demo/video/upload/v1/ln-hostel/gallery/tour.mp4',
      public_id: 'ln-hostel/gallery/tour',
      resource_type: 'video',
      url: 'http://res.cloudinary.com/demo/video/upload/v1/ln-hostel/gallery/tour.mp4',
      format: 'mp4',
      width: 1280,
      height: 720,
      bytes: 4,
    });
    mockGalleryCreate.mockResolvedValue({
      ...GALLERY_DOC,
      url: 'https://res.cloudinary.com/demo/video/upload/v1/ln-hostel/gallery/tour.mp4',
      publicId: 'ln-hostel/gallery/tour',
      resourceType: 'video',
      category: 'event',
      altText: 'Virtual tour video',
    });

    const request = buildRequest({
      file: makeFile('tour.mp4', 'video/mp4'),
      branchId: 'ln-vidhani',
      category: 'event',
      altText: 'Virtual tour video',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockGalleryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ resourceType: 'video' })
    );
    expect(body.success).toBe(true);
  });

  it('treats non-video resource_type from Cloudinary as "image" (defensive)', async () => {
    mockUploadToCloudinary.mockResolvedValue({
      ...CLOUDINARY_IMAGE_RESPONSE,
      resource_type: 'raw', // unexpected value
    });

    const request = buildRequest(VALID_FIELDS);
    await POST(request);

    expect(mockGalleryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ resourceType: 'image' })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 19c — Invalid file type returns 400
// ---------------------------------------------------------------------------

describe('Property 19c — Invalid file type returns 400', () => {
  it('rejects application/pdf with 400', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      file: makeFile('document.pdf', 'application/pdf'),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(mockGalleryCreate).not.toHaveBeenCalled();
  });

  it('rejects image/gif with 400', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      file: makeFile('anim.gif', 'image/gif'),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

  it('rejects video/quicktime with 400', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      file: makeFile('clip.mov', 'video/quicktime'),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

  it('accepts image/jpeg', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      file: makeFile('photo.jpg', 'image/jpeg'),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('accepts image/png', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      file: makeFile('photo.png', 'image/png'),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('accepts image/webp', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      file: makeFile('photo.webp', 'image/webp'),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('accepts video/mp4', async () => {
    const request = buildRequest({
      ...VALID_FIELDS,
      file: makeFile('clip.mp4', 'video/mp4'),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// Property 19d — File too large returns 413
// ---------------------------------------------------------------------------

describe('Property 19d — File too large returns 413', () => {
  const FIFTY_MB = 50 * 1024 * 1024;

  it('returns 413 when file size exceeds 50 MB', async () => {
    const oversizedFile = makeFile('huge.jpg', 'image/jpeg', FIFTY_MB + 1);
    const request = buildRequest({ ...VALID_FIELDS, file: oversizedFile });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/too large/i);
    expect(mockUploadToCloudinary).not.toHaveBeenCalled();
  });

  it('accepts a file of exactly 50 MB (boundary — must not be 413)', async () => {
    const maxFile = makeFile('max.jpg', 'image/jpeg', FIFTY_MB);
    const request = buildRequest({ ...VALID_FIELDS, file: maxFile });
    const response = await POST(request);

    expect(response.status).not.toBe(413);
  });
});

// ---------------------------------------------------------------------------
// Property 19e — Missing required fields return 400
// ---------------------------------------------------------------------------

describe('Property 19e — Missing required fields return 400', () => {
  it('returns 400 when file is missing', async () => {
    const fd = new FormData();
    fd.append('branchId', 'ln-vidhani');
    fd.append('category', 'room');
    fd.append('altText', 'A room');
    const request = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'X-CSRF-Token': CSRF_TOKEN },
      body: fd,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/file/i);
  });

  it('returns 400 when branchId is missing', async () => {
    const request = buildRequest({
      file: VALID_FIELDS.file,
      branchId: null,
      category: 'room',
      altText: 'A room',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/branchId/i);
  });

  it('returns 400 when branchId is blank whitespace', async () => {
    const request = buildRequest({ ...VALID_FIELDS, branchId: '   ' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when category is missing', async () => {
    const request = buildRequest({
      file: VALID_FIELDS.file,
      branchId: 'ln-vidhani',
      category: null,
      altText: 'A room',
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/category/i);
  });

  it('returns 400 when category is an invalid enum value', async () => {
    const request = buildRequest({ ...VALID_FIELDS, category: 'swimming-pool' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when altText is missing', async () => {
    const request = buildRequest({
      file: VALID_FIELDS.file,
      branchId: 'ln-vidhani',
      category: 'room',
      altText: null,
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/altText/i);
  });

  it('returns 400 when altText is empty string', async () => {
    const request = buildRequest({ ...VALID_FIELDS, altText: '' });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when altText exceeds 200 characters', async () => {
    const request = buildRequest({ ...VALID_FIELDS, altText: 'a'.repeat(201) });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Auth and CSRF guard tests
// ---------------------------------------------------------------------------

describe('Auth and CSRF guards', () => {
  it('returns 401 when session has no adminId', async () => {
    mockGetSession.mockResolvedValueOnce({});
    const request = buildRequest(VALID_FIELDS);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockGalleryCreate).not.toHaveBeenCalled();
  });

  it('returns 403 when CSRF token is invalid', async () => {
    mockValidateCsrfToken.mockReturnValueOnce(false);
    const request = buildRequest(VALID_FIELDS);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ success: false, error: 'Invalid CSRF token' });
    expect(mockGalleryCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error handling — 500 paths
// ---------------------------------------------------------------------------

describe('Error handling — 500 paths', () => {
  it('returns 500 when uploadToCloudinary throws', async () => {
    mockUploadToCloudinary.mockRejectedValueOnce(new Error('Cloudinary network error'));
    const request = buildRequest(VALID_FIELDS);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Internal server error' });
    expect(mockGalleryCreate).not.toHaveBeenCalled();
  });

  it('returns 500 when Gallery.create throws', async () => {
    mockGalleryCreate.mockRejectedValueOnce(new Error('MongoDB write failed'));
    const request = buildRequest(VALID_FIELDS);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: 'Internal server error' });
  });
});
