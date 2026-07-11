/**
 * Vitest global test setup
 *
 * This file runs before each test suite. It:
 *  - Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
 *  - Sets up any global mocks or env variables needed across all tests
 */
import "@testing-library/jest-dom";

// Provide a default NEXT_PUBLIC_SITE_URL for tests that need it
if (!process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.NEXT_PUBLIC_SITE_URL = "https://lnboyspg.in";
}
