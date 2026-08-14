/**
 * DB-backed tests for the expanded Asset seeding (lib/markets/seed-assets.ts)
 * and /api/markets, against the real test Postgres instance (same
 * convention as tests/spot-trading.test.ts).
 *
 * fetchTickerSnapshot is mocked to reject so these tests are fast and
 * deterministic (no dependency on live Binance reachability) — that's
 * exactly the "offline" fallback path seedAssets already has to handle
 * correctly, so it's a meaningful path to exercise anyway.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { resetDatabase } from "./helpers";
import { seedAssets } from "@/lib/markets/seed-assets";
import { MARKET_REGISTRY } from "@/lib/binance/client";
import { GET } from "@/app/api/markets/route";

vi.mock("@/lib/binance/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/binance/client")>();
  return {
    ...actual,
    fetchTickerSnapshot: vi.fn().mockRejectedValue(new Error("offline in tests")),
  };
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("seedAssets — idempotent upsert", () => {
  it("creates exactly one Asset row per MARKET_REGISTRY entry", async () => {
    const count = await seedAssets(prisma);
    expect(count).toBe(MARKET_REGISTRY.length);

    const rows = await prisma.asset.findMany();
    expect(rows).toHaveLength(MARKET_REGISTRY.length);
    expect(new Set(rows.map((r) => r.symbol)).size).toBe(MARKET_REGISTRY.length);
  });

  it("running it again does not create duplicates", async () => {
    await seedAssets(prisma);
    await seedAssets(prisma);

    const rows = await prisma.asset.findMany();
    expect(rows).toHaveLength(MARKET_REGISTRY.length);
  });

  it("running it again does not overwrite an existing row's price", async () => {
    await seedAssets(prisma);
    const symbol = MARKET_REGISTRY[0]!.symbol;

    await prisma.asset.update({ where: { symbol }, data: { lastPrice: 123456.78 } });

    await seedAssets(prisma); // re-seed — must not clobber the manual price above

    const asset = await prisma.asset.findUniqueOrThrow({ where: { symbol } });
    expect(Number(asset.lastPrice)).toBe(123456.78);
  });
});

describe("GET /api/markets — expanded list", () => {
  it("returns every seeded asset, not just the original 8", async () => {
    await seedAssets(prisma);

    const res = await GET();
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(MARKET_REGISTRY.length);
    expect(body.data.length).toBeGreaterThanOrEqual(50);
  });

  it("keeps the same response shape existing clients depend on", async () => {
    await seedAssets(prisma);

    const res = await GET();
    const body = await res.json();

    const row = body.data[0];
    expect(row).toHaveProperty("id");
    expect(row).toHaveProperty("symbol");
    expect(row).toHaveProperty("displaySymbol");
    expect(row).toHaveProperty("category");
    expect(row).toHaveProperty("price");
    expect(row).toHaveProperty("change24h");
  });
});
