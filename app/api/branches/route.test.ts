// @vitest-environment node

/**
 * Unit tests for app/api/branches/route.ts
 *
 * Covers:
 * - GET /api/branches: public endpoint, list all branches
 * - POST /api/branches: admin-only endpoint, create new branch
 * - Authentication checks (401 for non-admin)
 * - Validation errors (400)
 * - Duplicate branchId errors (422)
 * - Internal server errors (500)
 *
 * Validates requirements 1.1, 13.1, 13.2
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { GET, POST } from './route';
import Branch from '@/lib/db/models/Branch';

// Mock the session module
let mockSession: { adminId?: string } = {};

// Mock getSession
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal valid branch data */
const validBranchData = {
  branchId: 'ln-vidhani',
  name: 'LN Boys PG Vidhani',
  address: 'Near JECRC College, Vidhani, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302017',
  phone: ['+918385857902'],
  whatsapp: '+918385857902',
  startingPrice: 8000,
  status: 'active' as const,
  occupancyTypes: ['Single', 'Double'],
};

/** Helper to create a mock Request with JSON body */
function createMockRequest(body: any): Request {
  return new Request('http://localhost:3000/api/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Set the MONGODB_URI environment variable for connectDB()
  process.env.MONGODB_URI = uri;
  
  await mongoose.connect(uri);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  await Branch.deleteMany({});
  // Reset mock session
  mockSession = {};
});

// ---------------------------------------------------------------------------
// GET /api/branches — public endpoint
// ---------------------------------------------------------------------------

describe('GET /api/branches', () => {
  it('returns empty array when no branches exist', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, data: [] });
  });

  it('returns all branches when branches exist', async () => {
    // Create test branches
    await Branch.create(validBranchData);
    await Branch.create({
      ...validBranchData,
      branchId: 'ln-mansarovar',
      name: 'LN Boys PG Mansarovar',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].branchId).toBeDefined();
    expect(data.data[1].branchId).toBeDefined();
  });

  it('returns branches with all expected fields', async () => {
    await Branch.create({
      ...validBranchData,
      rating: 4.5,
      latitude: 26.8467,
      longitude: 75.8025,
      metaTitle: 'Best PG in Vidhani',
      metaDescription: 'Affordable PG near JECRC',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);

    const branch = data.data[0];
    expect(branch.branchId).toBe('ln-vidhani');
    expect(branch.name).toBe('LN Boys PG Vidhani');
    expect(branch.rating).toBe(4.5);
    expect(branch.latitude).toBe(26.8467);
    expect(branch.longitude).toBe(75.8025);
    expect(branch.metaTitle).toBe('Best PG in Vidhani');
  });

  it('returns 500 on database error', async () => {
    // Disconnect to simulate database error and clear cache
    await mongoose.disconnect();
    // Clear mongoose cache to force a new connection attempt
    global._mongooseCache = { conn: null, promise: null };
    // Unset MONGODB_URI to trigger error in connectDB
    const savedUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ success: false, error: 'Internal server error' });

    // Restore and reconnect for other tests
    process.env.MONGODB_URI = savedUri;
    global._mongooseCache = { conn: null, promise: null };
    await mongoose.connect(savedUri!);
  });
});

// ---------------------------------------------------------------------------
// POST /api/branches — authentication
// ---------------------------------------------------------------------------

describe('POST /api/branches — authentication', () => {
  it('returns 401 when session has no adminId', async () => {
    mockSession = {}; // No adminId
    const request = createMockRequest(validBranchData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('allows request when session has adminId', async () => {
    mockSession = { adminId: 'admin123' };
    const request = createMockRequest(validBranchData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/branches — validation (Zod)
// ---------------------------------------------------------------------------

describe('POST /api/branches — validation errors (400)', () => {
  beforeEach(() => {
    mockSession = { adminId: 'admin123' }; // Set admin session
  });

  it('returns 400 when branchId is missing', async () => {
    const { branchId, ...invalidData } = validBranchData;
    const request = createMockRequest(invalidData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('returns 400 when branchId is too short', async () => {
    const request = createMockRequest({
      ...validBranchData,
      branchId: 'ab', // Less than 3 chars
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('branchId');
  });

  it('returns 400 when branchId has invalid format', async () => {
    const request = createMockRequest({
      ...validBranchData,
      branchId: 'LN-Vidhani', // Uppercase not allowed
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('lowercase');
  });

  it('returns 400 when name is missing', async () => {
    const { name, ...invalidData } = validBranchData;
    const request = createMockRequest(invalidData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('returns 400 when name is empty string', async () => {
    const request = createMockRequest({
      ...validBranchData,
      name: '',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 when pincode is not 6 digits', async () => {
    const request = createMockRequest({
      ...validBranchData,
      pincode: '12345', // Only 5 digits
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('6 digits');
  });

  it('returns 400 when phone array is empty', async () => {
    const request = createMockRequest({
      ...validBranchData,
      phone: [],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('phone');
  });

  it('returns 400 when phone array has more than 5 entries', async () => {
    const request = createMockRequest({
      ...validBranchData,
      phone: ['1', '2', '3', '4', '5', '6'],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 when status is invalid', async () => {
    const request = createMockRequest({
      ...validBranchData,
      status: 'inactive', // Not in enum
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('status');
  });

  it('returns 400 when startingPrice is below minimum', async () => {
    const request = createMockRequest({
      ...validBranchData,
      startingPrice: 0, // Below 0.01
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 when startingPrice is above maximum', async () => {
    const request = createMockRequest({
      ...validBranchData,
      startingPrice: 1000000, // Above 999999.99
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('returns 400 when occupancyTypes array is empty', async () => {
    const request = createMockRequest({
      ...validBranchData,
      occupancyTypes: [],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/branches — successful creation (201)
// ---------------------------------------------------------------------------

describe('POST /api/branches — successful creation (201)', () => {
  beforeEach(() => {
    mockSession = { adminId: 'admin123' };
  });

  it('creates a branch with required fields only', async () => {
    const request = createMockRequest(validBranchData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.branchId).toBe('ln-vidhani');
    expect(data.data.name).toBe('LN Boys PG Vidhani');
    expect(data.data._id).toBeDefined();
  });

  it('creates a branch with all optional fields', async () => {
    const fullData = {
      ...validBranchData,
      rating: 4.5,
      latitude: 26.8467,
      longitude: 75.8025,
      metaTitle: 'Best PG in Vidhani',
      metaDescription: 'Affordable PG near JECRC',
    };
    const request = createMockRequest(fullData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.rating).toBe(4.5);
    expect(data.data.latitude).toBe(26.8467);
    expect(data.data.metaTitle).toBe('Best PG in Vidhani');
  });

  it('persists the branch to database', async () => {
    const request = createMockRequest(validBranchData);

    await POST(request);

    const saved = await Branch.findOne({ branchId: 'ln-vidhani' });
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('LN Boys PG Vidhani');
  });

  it('creates branch with status "coming-soon"', async () => {
    const request = createMockRequest({
      ...validBranchData,
      status: 'coming-soon',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.status).toBe('coming-soon');
  });
});

// ---------------------------------------------------------------------------
// POST /api/branches — duplicate branchId (422)
// ---------------------------------------------------------------------------

describe('POST /api/branches — duplicate branchId (422)', () => {
  beforeEach(() => {
    mockSession = { adminId: 'admin123' };
  });

  it('returns 422 when branchId already exists', async () => {
    // Create first branch
    await Branch.create(validBranchData);

    // Try to create duplicate
    const request = createMockRequest(validBranchData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Branch ID already exists');
  });

  it('allows creating branch with different branchId', async () => {
    // Create first branch
    await Branch.create(validBranchData);

    // Create second branch with different branchId
    const request = createMockRequest({
      ...validBranchData,
      branchId: 'ln-mansarovar',
      name: 'LN Boys PG Mansarovar',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/branches — internal server error (500)
// ---------------------------------------------------------------------------

describe('POST /api/branches — internal server error (500)', () => {
  beforeEach(() => {
    mockSession = { adminId: 'admin123' };
  });

  it('returns 500 on database connection error', async () => {
    // Disconnect to simulate database error and clear cache
    await mongoose.disconnect();
    global._mongooseCache = { conn: null, promise: null };
    // Unset MONGODB_URI to trigger error in connectDB
    const savedUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    const request = createMockRequest(validBranchData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ success: false, error: 'Internal server error' });

    // Restore and reconnect for other tests
    process.env.MONGODB_URI = savedUri;
    global._mongooseCache = { conn: null, promise: null };
    await mongoose.connect(savedUri!);
  });
});

// ---------------------------------------------------------------------------
// Response envelope format
// ---------------------------------------------------------------------------

describe('Response envelope format', () => {
  it('GET success returns { success: true, data: [...] }', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data).not.toHaveProperty('error');
    expect(data.success).toBe(true);
  });

  it('GET error returns { success: false, error: "..." }', async () => {
    // Disconnect to simulate database error and clear cache
    await mongoose.disconnect();
    global._mongooseCache = { conn: null, promise: null };
    // Unset MONGODB_URI to trigger error in connectDB
    const savedUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('error');
    expect(data).not.toHaveProperty('data');
    expect(data.success).toBe(false);

    // Restore and reconnect for other tests
    process.env.MONGODB_URI = savedUri;
    global._mongooseCache = { conn: null, promise: null };
    await mongoose.connect(savedUri!);
  });

  it('POST success returns { success: true, data: {...} }', async () => {
    mockSession = { adminId: 'admin123' };
    const request = createMockRequest(validBranchData);

    const response = await POST(request);
    const data = await response.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('data');
    expect(data).not.toHaveProperty('error');
    expect(data.success).toBe(true);
  });

  it('POST error returns { success: false, error: "..." }', async () => {
    mockSession = {}; // No admin
    const request = createMockRequest(validBranchData);

    const response = await POST(request);
    const data = await response.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('error');
    expect(data).not.toHaveProperty('data');
    expect(data.success).toBe(false);
  });
});
