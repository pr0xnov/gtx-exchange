/**
 * Pre-production audit fix: prisma/seed.ts used to unconditionally
 * create/ensure demo@gtx.com (password "Demo123!", a 10,000 USDT funded
 * wallet) on every migrator run — including a real production deploy,
 * since nothing gated it. shouldSeedDemoUser() (lib/seed/
 * should-seed-demo-user.ts) is the extracted decision; this only checks
 * that logic in isolation — it never imports prisma/seed.ts itself,
 * which runs for real against DATABASE_URL the moment it's imported.
 */
import { describe, expect, it } from "vitest";
import { shouldSeedDemoUser } from "@/lib/seed/should-seed-demo-user";

describe("shouldSeedDemoUser", () => {
  it("returns false when NODE_ENV is production — demo user must not seed", () => {
    expect(shouldSeedDemoUser("production")).toBe(false);
  });

  it("returns true for development", () => {
    expect(shouldSeedDemoUser("development")).toBe(true);
  });

  it("returns true for test", () => {
    expect(shouldSeedDemoUser("test")).toBe(true);
  });

  it("returns true when NODE_ENV is unset (defensive default: don't accidentally skip in dev)", () => {
    expect(shouldSeedDemoUser(undefined)).toBe(true);
  });
});
