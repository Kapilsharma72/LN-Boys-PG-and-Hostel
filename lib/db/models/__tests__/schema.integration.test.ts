/**
 * Schema Integration Tests — Property 2 & Property 25
 *
 * Property 2:  Branch schema field constraints hold after round-trip persistence
 * Property 25: Blog post slug uniqueness — duplicate slugs are rejected at the database level
 *
 * Validates: Requirements 1.1, 8.3
 *
 * Uses mongodb-memory-server to spin up an isolated in-memory MongoDB instance
 * so these tests have no dependency on a real database and run fully offline.
 */

// @vitest-environment node

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

// Import models — we must import them AFTER connecting so their schemas
// register against the correct connection. We also need to prevent Mongoose
// from reusing a cached model from another test file, so we delete cached
// model entries and recompile against the in-memory connection.
import Branch from '../Branch';
import Post from '../Post';

// ---------------------------------------------------------------------------
// Test lifecycle — one MongoMemoryServer for the whole suite
// ---------------------------------------------------------------------------

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { bufferCommands: false });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clear all collections between tests to keep tests independent
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid Branch document */
function validBranch(overrides: Record<string, unknown> = {}) {
  return {
    branchId: 'ln-main',
    name: 'LN Main Branch',
    address: '123 MG Road, Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    phone: ['+919876543210'],
    whatsapp: '+919876543210',
    startingPrice: 5000,
    status: 'active' as const,
    occupancyTypes: ['single', 'double'],
    ...overrides,
  };
}

/** Minimal valid Post document */
function validPost(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'my-first-post',
    title: 'My First Post',
    excerpt: 'A short excerpt for the post.',
    content: 'Full content of the blog post goes here.',
    author: 'Admin',
    publishedAt: new Date('2024-01-01'),
    metaTitle: 'My First Post | LN Boys PG',
    metaDescription: 'Meta description for the first post.',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Property 2 — Branch schema round-trip
// **Validates: Requirements 1.1**
// ---------------------------------------------------------------------------

describe('Property 2 — Branch schema field constraints hold after round-trip persistence', () => {
  it('persists a valid Branch document and reads back all fields correctly', async () => {
    const data = validBranch();
    const created = await Branch.create(data);

    const found = await Branch.findById(created._id).lean();

    expect(found).not.toBeNull();
    expect(found!.branchId).toBe(data.branchId);
    expect(found!.name).toBe(data.name);
    expect(found!.address).toBe(data.address);
    expect(found!.city).toBe(data.city);
    expect(found!.state).toBe(data.state);
    expect(found!.pincode).toBe(data.pincode);
    expect(found!.phone).toEqual(data.phone);
    expect(found!.whatsapp).toBe(data.whatsapp);
    expect(found!.startingPrice).toBe(data.startingPrice);
    expect(found!.status).toBe(data.status);
    expect(found!.occupancyTypes).toEqual(data.occupancyTypes);
    // Timestamp fields should be set automatically
    expect(found!.createdAt).toBeInstanceOf(Date);
    expect(found!.updatedAt).toBeInstanceOf(Date);
  });

  it('throws ValidationError when required field "name" is missing', async () => {
    const data = validBranch({ name: undefined });
    await expect(Branch.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('throws ValidationError when required field "address" is missing', async () => {
    const data = validBranch({ address: undefined });
    await expect(Branch.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('throws ValidationError when required field "phone" is missing', async () => {
    const data = validBranch({ phone: undefined });
    await expect(Branch.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('throws ValidationError when required field "status" is missing', async () => {
    const data = validBranch({ status: undefined });
    await expect(Branch.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('throws ValidationError when branchId does not match slug regex', async () => {
    // Uppercase letters violate ^[a-z0-9]+(-[a-z0-9]+)*$
    const data = validBranch({ branchId: 'LN-Main' });
    await expect(Branch.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('throws ValidationError when branchId contains spaces', async () => {
    const data = validBranch({ branchId: 'ln main' });
    await expect(Branch.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('throws ValidationError when branchId has a trailing hyphen', async () => {
    const data = validBranch({ branchId: 'ln-main-' });
    await expect(Branch.create(data)).rejects.toThrow(
      mongoose.Error.ValidationError
    );
  });

  it('throws a duplicate key error (E11000) when branchId is not unique', async () => {
    await Branch.create(validBranch());

    let caughtError: unknown;
    try {
      // Second insert with the same branchId must fail
      await Branch.create(validBranch({ name: 'Other Branch' }));
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    // MongoDB duplicate key errors carry code 11000
    expect((caughtError as { code?: number }).code).toBe(11000);
  });
});

// ---------------------------------------------------------------------------
// Property 25 — Post slug uniqueness
// **Validates: Requirements 8.3**
// ---------------------------------------------------------------------------

describe('Property 25 — Blog post slug uniqueness — duplicate slugs are rejected at the database level', () => {
  it('persists a valid Post document with a unique slug', async () => {
    const data = validPost();
    const created = await Post.create(data);

    const found = await Post.findById(created._id).lean();
    expect(found).not.toBeNull();
    expect(found!.slug).toBe(data.slug);
  });

  it('throws a duplicate key error (E11000) when a second Post uses the same slug', async () => {
    await Post.create(validPost());

    let caughtError: unknown;
    try {
      // Different title/content but the SAME slug — must be rejected
      await Post.create(
        validPost({
          title: 'Another Post With Same Slug',
          excerpt: 'Different excerpt.',
          content: 'Different content.',
        })
      );
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as { code?: number }).code).toBe(11000);
  });

  it('allows two Posts with different slugs', async () => {
    await Post.create(validPost({ slug: 'first-post' }));
    const second = await Post.create(validPost({ slug: 'second-post' }));

    expect(second.slug).toBe('second-post');
  });
});
