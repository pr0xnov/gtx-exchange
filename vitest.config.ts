import path from "node:path";
import { defineConfig } from "vitest/config";

// Isolated test database — see docker-compose.test.yml. Deliberately never
// the dev DATABASE_URL from .env: these tests truncate tables between runs.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://gtx:gtx_password@localhost:5433/gtx_exchange_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  // tsconfig.json sets jsx:"preserve" for Next's own SWC pipeline; Vite's
  // esbuild transform (which vitest uses) needs its own JSX config, or
  // .tsx files under test fail with "React is not defined".
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      NODE_ENV: "test",
      JWT_ACCESS_SECRET: "test_access_secret_at_least_32_characters_long",
      JWT_REFRESH_SECRET: "test_refresh_secret_at_least_32_characters_long",
    },
  },
});
