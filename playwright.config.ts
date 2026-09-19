import { defineConfig } from "@playwright/test";

// One-off responsive smoke-test config for the mobile refactor task —
// points at the already-running `npm run dev` server rather than starting
// its own (avoids a second Next.js process on an already memory-tight
// dev machine). Not part of the regular `npm test` suite (that's vitest;
// see vitest.config.ts) — run explicitly with `npx playwright test`.
export default defineConfig({
  testDir: "./tests-playwright",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3001",
    screenshot: "only-on-failure",
  },
  reporter: [["list"]],
});
