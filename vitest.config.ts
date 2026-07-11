import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate a browser environment
    environment: "jsdom",
    // Enable global test APIs (describe, it, expect, etc.) without imports
    globals: true,
    // Run setup file before each test suite
    setupFiles: ["./vitest.setup.ts"],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      // Exclude non-source files from coverage reports
      exclude: [
        "node_modules/**",
        ".next/**",
        "coverage/**",
        "public/**",
        "scripts/**",
        "**/*.config.{js,ts,mjs}",
        "**/*.d.ts",
        "vitest.setup.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
