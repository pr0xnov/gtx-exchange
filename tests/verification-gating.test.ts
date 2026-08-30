/**
 * Verification must gate Withdrawal only — Trading (Spot Buy/Sell here;
 * Futures orders never had a verification check either, per
 * app/api/orders/route.ts) stays open to any authenticated user.
 * Exercises the real routes (app/api/spot/orders, app/api/withdraw)
 * against a real test-DB VerificationDocument state, same pattern as
 * tests/spot-trading.test.ts.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { POST as spotOrder } from "@/app/api/spot/orders/route";
import { POST as withdraw } from "@/app/api/withdraw/route";
import {
  jsonRequest,
  resetDatabase,
  seedAsset,
  seedSpotWallet,
  seedUserWithWallet,
} from "./helpers";

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
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: string }>;
}

describe("Spot Trading requires no verification", () => {
  it("an unverified user (no VerificationDocument rows at all) can place a spot MARKET BUY", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    await seedAsset(50_000, "NOVERIFYBUYUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "NOVERIFYBUYUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.01,
      })
    );
    expect(res.status).toBe(201);
  });

  it("an unverified user can place a spot MARKET SELL", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "NOVERIFYSELLUSDT");
    await seedSpotWallet({ userId: user.id, currency: asset.baseAsset, balance: 0.02 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "NOVERIFYSELLUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 0.01,
      })
    );
    expect(res.status).toBe(201);
  });
});

describe("Withdrawal requires verification", () => {
  it("rejects an unverified user's withdrawal with a clear error, balance untouched", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 500 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 100, method: "TETHER_USDT" })
    );
    const json = await readJson(res);
    expect(res.status).toBe(403);
    expect(json.error).toBe("Please complete verification before withdrawing funds");

    const spotWallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: user.id, currency: "USDT" } },
    });
    expect(Number(spotWallet!.balance)).toBe(500);
  });

  it("allows a verified user's withdrawal to proceed exactly as before", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 500 });
    await prisma.verificationDocument.createMany({
      data: [
        { userId: user.id, type: "IDENTITY", fileName: "id.png", status: "APPROVED" },
        {
          userId: user.id,
          type: "PROOF_OF_ADDRESS",
          fileName: "poa.png",
          status: "APPROVED",
        },
      ],
    });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 100, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(201);

    const spotWallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: user.id, currency: "USDT" } },
    });
    expect(Number(spotWallet!.balance)).toBe(400);
  });

  it("also counts submitted-but-still-PENDING documents as verified (no reviewer/approval flow exists anywhere in this app)", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 500 });
    await prisma.verificationDocument.createMany({
      data: [
        { userId: user.id, type: "IDENTITY", fileName: "id.png" },
        { userId: user.id, type: "PROOF_OF_ADDRESS", fileName: "poa.png" },
      ],
    });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 100, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(201);
  });

  it("still blocks withdrawal if only one of the two required documents was submitted", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 500 });
    await prisma.verificationDocument.create({
      data: { userId: user.id, type: "IDENTITY", fileName: "id.png", status: "APPROVED" },
    });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 100, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(403);
  });

  it("still blocks withdrawal if a required document was rejected", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 500 });
    await prisma.verificationDocument.createMany({
      data: [
        { userId: user.id, type: "IDENTITY", fileName: "id.png", status: "REJECTED" },
        {
          userId: user.id,
          type: "PROOF_OF_ADDRESS",
          fileName: "poa.png",
          status: "APPROVED",
        },
      ],
    });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 100, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(403);
  });
});
