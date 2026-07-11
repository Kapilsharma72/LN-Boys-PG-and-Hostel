import mongoose from 'mongoose';
import * as dns from 'dns';

// Force Google DNS globally — fixes MongoDB Atlas SRV resolution failures
// on corporate/restricted networks where the system DNS can't resolve
// _mongodb._tcp.*.mongodb.net SRV records.
dns.setServers(['8.8.8.8', '8.8.4.4']);

// ---------------------------------------------------------------------------
// Global cache type declaration
// Ensures the cached connection survives hot-reloads in Next.js dev mode
// without opening a new connection on every module re-evaluation.
// ---------------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Initialise the cache from the global object (survives hot reloads) or
// create a fresh empty cache on first import.
const cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = global._mongooseCache ?? { conn: null, promise: null };

// Keep the global reference in sync so subsequent imports reuse the same object.
global._mongooseCache = cached;

/**
 * connectDB
 *
 * Returns a resolved Mongoose instance, re-using an in-flight connection
 * promise or an already-established connection where possible.
 *
 * `bufferCommands: false` is set so that Mongoose throws immediately if a
 * query is issued before the connection is ready, rather than silently
 * buffering it — this surfaces mis-ordered initialisation early.
 *
 * @throws {Error} If MONGODB_URI is not defined in the environment.
 */
export async function connectDB(): Promise<typeof mongoose> {
  // Return immediately if we already have a live connection.
  if (cached.conn) {
    return cached.conn;
  }

  // Kick off the connection promise only once, even if connectDB() is called
  // concurrently before the first promise resolves.
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        'MONGODB_URI environment variable is not defined. ' +
          'Add it to your .env.local file or deployment environment.'
      );
    }

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  // Await the in-flight (or newly created) promise and cache the result.
  cached.conn = await cached.promise;
  return cached.conn;
}
