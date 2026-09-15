/**
 * Backend-authoritative withdrawal balance validation
 * (app/api/withdraw/route.ts + lib/validation/trading.ts's withdrawSchema)
 * — the fix's actual security boundary. The frontend (see
 * tests/withdrawal-form.test.ts) never gets to decide whether a
 * withdrawal is allowed; this file proves the server independently
 * rejects an over-balance request, never debits/creates anything when it
 * does, and stays safe under two concurrent requests that together
 * exceed the balance (Part 8/Test H, Part 7/Test I of the fix's own spec).
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as withdraw } from "@/app/api/withdraw/route";
import {
  jsonRequest,
  resetDatabase,
  seedSpotWallet,
  seedUserWithWallet,
} from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
}

async function seedVerifiedUser(spotUsdtBalance: number) {
  const user = await seedUserWithWallet(0);
  await seedSpotWallet({ userId: user.id, currency: "USDT", balance: spotUsdtBalance });
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
  return user;
}

function withdrawPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    amount: 500,
    method: "TETHER_USDT",
    network: "TRX",
    destinationAddress: "TXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    ...overrides,
  };
}

async function usdtBalance(userId: string): Promise<number> {
  const wallet = await prisma.spotWallet.findUnique({
    where: { userId_currency: { userId, currency: "USDT" } },
  });
  return Number(wallet?.balance ?? 0);
}

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  vi.mocked(cookies).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("I — requesting more than the available balance", () => {
  it("rejects with a 4xx, never debits the wallet, never creates a withdrawal", async () => {
    const user = await seedVerifiedUser(28182.5);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 28182.51 }))
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    expect(await usdtBalance(user.id)).toBe(28182.5); // untouched
    expect(await prisma.transaction.count({ where: { userId: user.id } })).toBe(0);
  });

  it("an amount exactly equal to the available balance succeeds and leaves 0", async () => {
    const user = await seedVerifiedUser(28182.5);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 28182.5 }))
    );

    expect(res.status).toBe(201);
    expect(await usdtBalance(user.id)).toBe(0);
    expect(
      await prisma.transaction.count({ where: { userId: user.id, type: "WITHDRAWAL" } })
    ).toBe(1);
  });

  it("a wildly oversized direct request (bypassing the frontend entirely) is still rejected", async () => {
    const user = await seedVerifiedUser(28182.5);
    loginAs(user);

    const res = await withdraw(
      jsonRequest(
        "http://test/api/withdraw",
        withdrawPayload({ amount: 9_999_999_999_999_999 })
      )
    );

    // Either the absolute-max schema guard (422) or the balance check
    // (400) catches this — either way it must be a clean 4xx with no
    // side effects, never a 500 from an oversized value reaching the DB.
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(await usdtBalance(user.id)).toBe(28182.5);
    expect(await prisma.transaction.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe("Decimal precision and finiteness — validation schema hardening", () => {
  it("rejects an amount with more than 2 decimal places", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 100.123 }))
    );
    expect(res.status).toBe(422);
    expect(await prisma.transaction.count({ where: { userId: user.id } })).toBe(0);
  });

  it("rejects a value that overflows to Infinity in a raw request", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    // Bypasses JSON.stringify on purpose — 1e400 is valid JSON number
    // syntax that JS's own JSON.parse silently overflows to Infinity,
    // exactly the shape a direct API caller (not this app's own
    // frontend) could send.
    const req = new NextRequest("http://test/api/withdraw", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: `{"amount": 1e400, "method": "TETHER_USDT", "network": "TRX", "destinationAddress": "TXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}`,
    });
    const res = await withdraw(req);
    expect(res.status).toBe(422);
    expect(await usdtBalance(user.id)).toBe(1000);
  });

  it("rejects an amount above the absolute maximum", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 20_000_000 }))
    );
    expect(res.status).toBe(422);
  });
});

describe("H — two concurrent withdrawals that together exceed the balance", () => {
  it("at most one succeeds; the wallet balance never goes negative", async () => {
    const user = await seedVerifiedUser(600);
    loginAs(user);

    const [resA, resB] = await Promise.all([
      withdraw(jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 500 }))),
      withdraw(jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 500 }))),
    ]);

    const statuses = [resA.status, resB.status].sort();
    // Exactly one 201 and one rejection — never both succeeding.
    expect(statuses[0]).toBeLessThan(400);
    expect(statuses[1]).toBeGreaterThanOrEqual(400);

    const finalBalance = await usdtBalance(user.id);
    expect(finalBalance).toBe(100); // 600 - 500, not -400
    expect(finalBalance).toBeGreaterThanOrEqual(0);

    const withdrawalCount = await prisma.transaction.count({
      where: { userId: user.id, type: "WITHDRAWAL" },
    });
    expect(withdrawalCount).toBe(1);
  });
});

describe("Existing withdrawal semantics are unchanged by this fix", () => {
  it("a valid withdrawal still debits exactly once and lands PENDING", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 250 }))
    );
    expect(res.status).toBe(201);
    const created = (await res.json()).data;
    expect(created.status).toBe("PENDING");
    expect(await usdtBalance(user.id)).toBe(750);
  });

  it("the minimum-amount rule (50 USDT) still applies", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", withdrawPayload({ amount: 10 }))
    );
    expect(res.status).toBe(422);
    expect(await usdtBalance(user.id)).toBe(1000);
  });
});
