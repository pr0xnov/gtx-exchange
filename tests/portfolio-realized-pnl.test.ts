/**
 * GET /api/portfolio — proves the new `realizedPnl` field (sum of
 * Trade.pnl, for Account's Profit card) is purely additive: every
 * existing field (balance/credit/equity/unrealizedPnl/usedMargin/
 * freeMargin) — which Trading's margin/risk math depends on — is
 * computed exactly as before, unaffected by closed-trade history.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { GET as getPortfolio } from "@/app/api/portfolio/route";
import { resetDatabase, seedAsset, seedUserWithWallet } from "./helpers";

vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
}));

beforeEach(async () => {
  await resetDatabase();
  vi.mocked(requireUser).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function readJson(res: Response) {
  return res.json() as Promise<{ success: boolean; data: Record<string, number> }>;
}

describe("GET /api/portfolio — realizedPnl", () => {
  it("is 0 when the user has no closed trades", async () => {
    const user = await seedUserWithWallet(1000);
    vi.mocked(requireUser).mockResolvedValue(user);

    const json = await readJson(await getPortfolio());
    expect(json.data.realizedPnl).toBe(0);
    expect(json.data.balance).toBe(1000);
  });

  it("sums Trade.pnl across every closed trade for this user", async () => {
    const user = await seedUserWithWallet(1000);
    const asset = await seedAsset(50_000, "REALIZEDUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    await prisma.trade.createMany({
      data: [
        {
          userId: user.id,
          assetId: asset.id,
          side: "LONG",
          amount: 0.1,
          entryPrice: 50_000,
          exitPrice: 53_000,
          pnl: 300,
        },
        {
          userId: user.id,
          assetId: asset.id,
          side: "SHORT",
          amount: 0.05,
          entryPrice: 50_000,
          exitPrice: 52_000,
          pnl: -100,
        },
      ],
    });

    const json = await readJson(await getPortfolio());
    expect(json.data.realizedPnl).toBe(200); // 300 - 100
  });

  it("never counts another user's closed trades", async () => {
    const user = await seedUserWithWallet(1000);
    const otherUser = await seedUserWithWallet(1000);
    const asset = await seedAsset(50_000, "ISOLATIONUSDT");
    await prisma.trade.create({
      data: {
        userId: otherUser.id,
        assetId: asset.id,
        side: "LONG",
        amount: 0.1,
        entryPrice: 50_000,
        exitPrice: 60_000,
        pnl: 1_000,
      },
    });
    vi.mocked(requireUser).mockResolvedValue(user);

    const json = await readJson(await getPortfolio());
    expect(json.data.realizedPnl).toBe(0);
  });

  it("does not change any existing field's value (margin/risk math untouched)", async () => {
    const user = await seedUserWithWallet(2_000);
    const asset = await seedAsset(50_000, "UNTOUCHEDUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    await prisma.trade.create({
      data: {
        userId: user.id,
        assetId: asset.id,
        side: "LONG",
        amount: 0.1,
        entryPrice: 50_000,
        exitPrice: 60_000,
        pnl: 1_000,
      },
    });

    const json = await readJson(await getPortfolio());
    expect(json.data.balance).toBe(2_000);
    expect(json.data.credit).toBe(0);
    expect(json.data.equity).toBe(2_000); // unrelated to realizedPnl
    expect(json.data.unrealizedPnl).toBe(0);
    expect(json.data.usedMargin).toBe(0);
    expect(json.data.freeMargin).toBe(2_000);
  });
});
