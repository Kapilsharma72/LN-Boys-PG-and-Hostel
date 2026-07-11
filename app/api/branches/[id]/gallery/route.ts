import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Gallery from '@/lib/db/models/Gallery';

/**
 * GET /api/branches/[id]/gallery
 *
 * Public route that returns all gallery items for a specific branch,
 * sorted by uploadedAt descending. Optionally filter by category via
 * the `?category=room` query param.
 *
 * Requirements: 11.2
 *
 * @param params - Route params containing the branchId
 * @returns 200 with { success: true, data: Gallery[] }
 * @returns 500 with { success: false, error: "Internal server error" }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build filter — always scope to this branch
    const filter: Record<string, string> = { branchId: params.id };

    // Apply optional category filter if provided
    const validCategories = ['room', 'common-area', 'food', 'exterior', 'event'];
    if (category && validCategories.includes(category)) {
      filter.category = category;
    }

    const galleryItems = await Gallery.find(filter)
      .sort({ uploadedAt: -1 })
      .lean();

    return NextResponse.json(
      { success: true, data: galleryItems },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[GET /api/branches/${params.id}/gallery] Error:`, error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
