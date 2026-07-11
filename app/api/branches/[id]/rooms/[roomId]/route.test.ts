import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PATCH, DELETE } from './route';
import { connectDB } from '@/lib/db/mongoose';
import Room from '@/lib/db/models/Room';
import { getSession } from '@/lib/auth/session';
import { validateCsrfToken } from '@/lib/csrf';
import { cookies } from 'next/headers';
import type { IronSession } from 'iron-session';
import type { SessionData } from '@/lib/auth/session';

// Mock dependencies
vi.mock('@/lib/db/mongoose');
vi.mock('@/lib/db/models/Room');
vi.mock('@/lib/auth/session');
vi.mock('@/lib/csrf');
vi.mock('next/headers');

/** Helper to create a mock IronSession object satisfying the full interface */
function mockIronSession(data: Partial<SessionData>): IronSession<SessionData> {
  return {
    ...data,
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    updateConfig: vi.fn(),
  } as unknown as IronSession<SessionData>;
}

describe('PATCH /api/branches/[id]/rooms/[roomId]', () => {
  const mockParams = { id: 'test-branch', roomId: '507f1f77bcf86cd799439011' };
  const mockRequest = (body: unknown, csrfToken: string | null = 'valid-token') => {
    return {
      json: vi.fn().mockResolvedValue(body),
      headers: {
        get: vi.fn((header: string) => {
          if (header === 'X-CSRF-Token') return csrfToken;
          return null;
        }),
      },
    } as unknown as Request;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(connectDB).mockResolvedValue(undefined as any);
    vi.mocked(getSession).mockResolvedValue(mockIronSession({ adminId: 'admin123' }));
    vi.mocked(validateCsrfToken).mockReturnValue(true);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(mockIronSession({}));

    const request = mockRequest({ pricePerMonth: 5000 });
    const response = await PATCH(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('should return 403 if CSRF token is invalid', async () => {
    vi.mocked(validateCsrfToken).mockReturnValue(false);

    const request = mockRequest({ pricePerMonth: 5000 });
    const response = await PATCH(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ success: false, error: 'Invalid CSRF token' });
  });

  it('should return 400 if validation fails', async () => {
    const request = mockRequest({ pricePerMonth: -100 }); // Invalid: negative price
    const response = await PATCH(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('pricePerMonth');
  });

  it('should return 404 if room is not found', async () => {
    vi.mocked(Room.findOneAndUpdate).mockResolvedValue(null);

    const request = mockRequest({ pricePerMonth: 5000 });
    const response = await PATCH(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: 'Room not found' });
  });

  it('should successfully update a room', async () => {
    const updatedRoom = {
      _id: mockParams.roomId,
      branchId: mockParams.id,
      occupancyType: 'Double',
      pricePerMonth: 6000,
      amenities: [],
      description: 'Updated room',
      available: true,
    };
    vi.mocked(Room.findOneAndUpdate).mockResolvedValue(updatedRoom as any);

    const request = mockRequest({
      pricePerMonth: 6000,
      description: 'Updated room',
    });
    const response = await PATCH(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, data: updatedRoom });
    expect(Room.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockParams.roomId, branchId: mockParams.id },
      { $set: { pricePerMonth: 6000, description: 'Updated room' } },
      { new: true, runValidators: true }
    );
  });

  it('should handle partial updates correctly', async () => {
    const updatedRoom = {
      _id: mockParams.roomId,
      branchId: mockParams.id,
      occupancyType: 'Single',
      pricePerMonth: 5000,
      amenities: [],
      description: 'Original description',
      available: false,
    };
    vi.mocked(Room.findOneAndUpdate).mockResolvedValue(updatedRoom as any);

    const request = mockRequest({ available: false }); // Only update available
    const response = await PATCH(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Room.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: mockParams.roomId, branchId: mockParams.id },
      { $set: { available: false } },
      { new: true, runValidators: true }
    );
  });

  it('should return 500 on database error', async () => {
    vi.mocked(Room.findOneAndUpdate).mockRejectedValue(
      new Error('Database error')
    );

    const request = mockRequest({ pricePerMonth: 5000 });
    const response = await PATCH(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ success: false, error: 'Internal server error' });
  });
});

describe('DELETE /api/branches/[id]/rooms/[roomId]', () => {
  const mockParams = { id: 'test-branch', roomId: '507f1f77bcf86cd799439011' };
  const mockRequest = (csrfToken: string | null = 'valid-token') => {
    return {
      headers: {
        get: vi.fn((header: string) => {
          if (header === 'X-CSRF-Token') return csrfToken;
          return null;
        }),
      },
    } as unknown as Request;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(connectDB).mockResolvedValue(undefined as any);
    vi.mocked(getSession).mockResolvedValue(mockIronSession({ adminId: 'admin123' }));
    vi.mocked(validateCsrfToken).mockReturnValue(true);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(mockIronSession({}));

    const request = mockRequest();
    const response = await DELETE(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('should return 403 if CSRF token is invalid', async () => {
    vi.mocked(validateCsrfToken).mockReturnValue(false);

    const request = mockRequest();
    const response = await DELETE(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ success: false, error: 'Invalid CSRF token' });
  });

  it('should return 404 if room is not found', async () => {
    vi.mocked(Room.findOneAndDelete).mockResolvedValue(null);

    const request = mockRequest();
    const response = await DELETE(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ success: false, error: 'Room not found' });
  });

  it('should successfully delete a room', async () => {
    const deletedRoom = {
      _id: mockParams.roomId,
      branchId: mockParams.id,
      occupancyType: 'Single',
      pricePerMonth: 5000,
      amenities: [],
      description: 'Room to delete',
      available: true,
    };
    vi.mocked(Room.findOneAndDelete).mockResolvedValue(deletedRoom as any);

    const request = mockRequest();
    const response = await DELETE(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, data: { deleted: true } });
    expect(Room.findOneAndDelete).toHaveBeenCalledWith({
      _id: mockParams.roomId,
      branchId: mockParams.id,
    });
  });

  it('should return 500 on database error', async () => {
    vi.mocked(Room.findOneAndDelete).mockRejectedValue(
      new Error('Database error')
    );

    const request = mockRequest();
    const response = await DELETE(request, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ success: false, error: 'Internal server error' });
  });
});
