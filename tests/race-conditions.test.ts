/**
 * Reproduces the two critical races from the ledger audit and proves the
 * fixes on feature/ledger-atomicity close them:
 *
 *  1. Two concurrent "close position" requests double-crediting the wallet.
 *  2. Two concurrent withdrawals driving the balance negative.
 *  3. A concurrent withdrawal + market order doing the same.
 *  4. Two concurrent fills of the same pending limit order.
 *
 * Each test fires the two operations at the same time with Promise.all
 * against a real Postgres instance (docker-compose.test.yml) — the row
 * locking Postgres does on the conditional UPDATE ... WHERE statements is
 * what actually arbitrates the race, not anything faked in the test.
 *
 * `requireUser` is mocked to hand out one fixed, shared user snapshot to
 * both concurrent calls — that's what makes the old code's stale
 * pre-transaction balance check deterministically racy instead of
 * flaky/timing-dependent: both calls see the exact same "before" state.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { POST as closePosition } from "@/app/api/orders/close/route";
import { POST as withdraw } from "@/app/api/withdraw/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { fillLimitOrder } from "../server/ws/fill-limit-order";
import {
  jsonRequest,
  resetDatabase,
  seedAsset,
  seedOpenPosition,
  seedPendingLimitOrder,
  seedUserWithWallet,
} from "./helpers";

// vi.mock calls are hoisted above these imports by Vitest, so every
// import of "@/lib/auth/session" above (including the transitive one
// inside lib/api-response.ts) resolves to this mock. We never let the
// real requireUser() run, so it never touches next/headers' cookies() —
// safe to call the route handlers outside of a real Next.js request.
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

describe("1. two concurrent closes of the same position", () => {
  it("credits the wallet exactly once, not twice", async () => {
    const user = await seedUserWithWallet(1_000);
    const asset = await seedAsset(50_000);
    const position = await seedOpenPosition({
      userId: user.id,
      assetId: asset.id,
      side: "LONG",
      amount: 1,
      leverage: 10,
      entryPrice: 50_000,
      currentPrice: 50_000, // flat market -> pnl = 0, so the margin credit is easy to check
      margin: 5_000,
    });
    vi.mocked(requireUser).mockResolvedValue(user);

    const body = { positionId: position.id };
    const [resA, resB] = await Promise.all([
      closePosition(jsonRequest("http://test/api/orders/close", body)),
      closePosition(jsonRequest("http://test/api/orders/close", body)),
    ]);
    const [jsonA, jsonB] = await Promise.all([readJson(resA), readJson(resB)]);
    const outcomes = [
      { status: resA.status, json: jsonA },
      { status: resB.status, json: jsonB },
    ];

    // Exactly one request wins the race; the other is told the position
    // is already closed — never both succeeding, never both failing.
    expect(outcomes.filter((o) => o.status === 200)).toHaveLength(1);
    const rejected = outcomes.filter((o) => o.status === 400);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]!.json.error).toBe("Position is already closed");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    // Credited margin (5000) + pnl (0) exactly once: 1000 + 5000 = 6000.
    // The bug credits it twice: 1000 + 5000 + 5000 = 11000.
    expect(Number(wallet.balance)).toBe(6_000);

    expect(
      await prisma.position.count({ where: { id: position.id, status: "CLOSED" } })
    ).toBe(1);
    expect(await prisma.trade.count({ where: { positionId: position.id } })).toBe(1); // not 2
  });
});

describe("2. two concurrent withdrawals", () => {
  it("never lets the balance go negative", async () => {
    const user = await seedUserWithWallet(100);
    vi.mocked(requireUser).mockResolvedValue(user);

    const body = { amount: 60, method: "BANK_TRANSFER" };
    const [resA, resB] = await Promise.all([
      withdraw(jsonRequest("http://test/api/withdraw", body)),
      withdraw(jsonRequest("http://test/api/withdraw", body)),
    ]);
    const [jsonA, jsonB] = await Promise.all([readJson(resA), readJson(resB)]);
    const outcomes = [
      { status: resA.status, json: jsonA },
      { status: resB.status, json: jsonB },
    ];

    // Balance 100, two withdrawals of 60 requested concurrently: only one
    // can possibly be funded.
    expect(outcomes.filter((o) => o.status === 201)).toHaveLength(1);
    const rejected = outcomes.filter((o) => o.status === 400);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]!.json.error).toBe("Insufficient balance for this withdrawal");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(Number(wallet.balance)).toBe(40);
    expect(Number(wallet.balance)).toBeGreaterThanOrEqual(0);

    expect(
      await prisma.transaction.count({ where: { userId: user.id, type: "WITHDRAWAL" } })
    ).toBe(1); // not 2
  });
});

describe("3. concurrent withdrawal + market order open", () => {
  it("never lets the balance go negative when two different operations compete for the same funds", async () => {
    const user = await seedUserWithWallet(100);
    await seedAsset(6_000, "RACEUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    // margin = amount(1) * price(6000) / leverage(100) = 60, same as the
    // withdrawal amount, so the two requests are symmetric: whichever
    // wins leaves exactly 40, and the other must be rejected either way.
    const orderBody = {
      symbol: "RACEUSDT",
      type: "MARKET",
      side: "BUY",
      amount: 1,
      leverage: 100,
    };
    const withdrawBody = { amount: 60, method: "BANK_TRANSFER" };

    const [orderRes, withdrawRes] = await Promise.all([
      createOrder(jsonRequest("http://test/api/orders", orderBody)),
      withdraw(jsonRequest("http://test/api/withdraw", withdrawBody)),
    ]);

    const succeeded = [orderRes.status, withdrawRes.status].filter((s) => s < 300);
    const failed = [orderRes.status, withdrawRes.status].filter((s) => s >= 400);
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    const balance = Number(wallet.balance);
    expect(balance).toBeGreaterThanOrEqual(0);
    expect(balance).toBe(40);
  });
});

describe("4. two concurrent fills of the same pending limit order", () => {
  it("opens exactly one position and debits the margin exactly once", async () => {
    const user = await seedUserWithWallet(3_000);
    const asset = await seedAsset(50_000, "FILLUSDT");
    const order = await seedPendingLimitOrder({
      userId: user.id,
      assetId: asset.id,
      side: "BUY",
      amount: 1,
      leverage: 20, // margin = 1 * 50000 / 20 = 2500
      limitPrice: 50_000,
    });
    const orderWithAsset = { ...order, asset };

    const [outcomeA, outcomeB] = await Promise.all([
      fillLimitOrder(prisma, orderWithAsset, {
        executionPrice: 50_000,
        symbol: "FILLUSDT",
      }),
      fillLimitOrder(prisma, orderWithAsset, {
        executionPrice: 50_000,
        symbol: "FILLUSDT",
      }),
    ]);

    // One call actually fills it, the other finds it already claimed.
    expect([outcomeA, outcomeB].sort()).toEqual(["already-handled", "filled"]);

    expect(await prisma.position.count({ where: { orderId: order.id } })).toBe(1); // not 2

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    // margin 2500 debited once: 3000 - 2500 = 500. The bug debits it
    // twice, driving the balance to 3000 - 2500 - 2500 = -2000.
    expect(Number(wallet.balance)).toBe(500);
    expect(Number(wallet.balance)).toBeGreaterThanOrEqual(0);

    expect(await prisma.order.count({ where: { id: order.id, status: "FILLED" } })).toBe(
      1
    );
  });
});
