/**
 * Deposit/Withdrawal + Admin Approve/Reject — the flow required by this
 * task:
 *  - Deposit: PENDING on create, balance untouched; Approve credits the
 *    Spot USDT wallet (the balance the user actually sees, see
 *    app/api/account/summary/route.ts); Reject leaves balance untouched.
 *  - Withdrawal: balance is debited IMMEDIATELY and atomically on create
 *    (PENDING); Approve does NOT touch balance again; Reject refunds it.
 *  - Double-action protection: a transaction that isn't PENDING anymore
 *    can never be decided a second time (Approve twice, Reject twice, or
 *    Approve-then-Reject/Reject-then-Approve).
 *  - Only an ADMIN/SUPER_ADMIN may decide; a plain USER gets 403.
 *
 * Auth exercised end to end (real JWT + real requireUser()/requireAdmin()
 * role check) via a mocked next/headers cookies() jar, same pattern as
 * tests/admin-balance-adjustment.test.ts.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as deposit } from "@/app/api/deposit/route";
import { POST as withdraw } from "@/app/api/withdraw/route";
import { PATCH as decideTransaction } from "@/app/api/admin/transactions/[id]/route";
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

function patchRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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

async function seedAdmin() {
  const admin = await seedUserWithWallet(0);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
  return admin;
}

async function usdtBalance(userId: string): Promise<number> {
  const wallet = await prisma.spotWallet.findUnique({
    where: { userId_currency: { userId, currency: "USDT" } },
  });
  return Number(wallet?.balance ?? 0);
}

function decide(id: string, decision: "APPROVE" | "REJECT") {
  return decideTransaction(
    patchRequest(`http://test/api/admin/transactions/${id}`, { decision }),
    {
      params: Promise.resolve({ id }),
    }
  );
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

describe("Deposit — create then Approve", () => {
  it("Balance 0 -> create 100 -> PENDING, balance still 0 -> Approve -> COMPLETED, balance 100", async () => {
    const user = await seedVerifiedUser(0);
    loginAs(user);

    const res = await deposit(
      jsonRequest("http://test/api/deposit", { amount: 100, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(201);
    const created = (await res.json()).data;
    expect(created.status).toBe("PENDING");
    expect(await usdtBalance(user.id)).toBe(0);

    const admin = await seedAdmin();
    loginAs(admin);
    const approveRes = await decide(created.id, "APPROVE");
    expect(approveRes.status).toBe(200);
    expect(await usdtBalance(user.id)).toBe(100);

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: created.id } });
    expect(tx.status).toBe("COMPLETED");
  });
});

describe("Deposit — create then Reject", () => {
  it("Balance 0 -> create 100 -> PENDING -> Reject -> FAILED, balance still 0", async () => {
    const user = await seedVerifiedUser(0);
    loginAs(user);

    const res = await deposit(
      jsonRequest("http://test/api/deposit", { amount: 100, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;

    const admin = await seedAdmin();
    loginAs(admin);
    const rejectRes = await decide(created.id, "REJECT");
    expect(rejectRes.status).toBe(200);
    expect(await usdtBalance(user.id)).toBe(0);

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: created.id } });
    expect(tx.status).toBe("FAILED");
  });
});

describe("Deposit — double Approve protection", () => {
  it("a second Approve does not credit balance again", async () => {
    const user = await seedVerifiedUser(0);
    loginAs(user);
    const res = await deposit(
      jsonRequest("http://test/api/deposit", { amount: 100, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;

    const admin = await seedAdmin();
    loginAs(admin);
    await decide(created.id, "APPROVE");
    expect(await usdtBalance(user.id)).toBe(100);

    const secondApprove = await decide(created.id, "APPROVE");
    expect(secondApprove.status).toBe(400);
    expect(await usdtBalance(user.id)).toBe(100); // unchanged, not 200
  });

  it("Approve then Reject on the same transaction is rejected — no refund/second decision", async () => {
    const user = await seedVerifiedUser(0);
    loginAs(user);
    const res = await deposit(
      jsonRequest("http://test/api/deposit", { amount: 100, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;

    const admin = await seedAdmin();
    loginAs(admin);
    await decide(created.id, "APPROVE");

    const rejectAfterApprove = await decide(created.id, "REJECT");
    expect(rejectAfterApprove.status).toBe(400);
    expect(await usdtBalance(user.id)).toBe(100); // still the approved credit, nothing extra
  });
});

describe("Withdrawal — creation immediately debits balance", () => {
  it("Balance 100 -> withdraw 60 -> PENDING, balance immediately 40", async () => {
    const user = await seedVerifiedUser(100);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 60, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(201);
    const created = (await res.json()).data;
    expect(created.status).toBe("PENDING");
    expect(await usdtBalance(user.id)).toBe(40);
  });
});

describe("Withdrawal — Approve does not debit again", () => {
  it("Balance 100 -> withdraw 60 -> 40 -> Approve -> COMPLETED, balance stays 40", async () => {
    const user = await seedVerifiedUser(100);
    loginAs(user);
    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 60, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;
    expect(await usdtBalance(user.id)).toBe(40);

    const admin = await seedAdmin();
    loginAs(admin);
    const approveRes = await decide(created.id, "APPROVE");
    expect(approveRes.status).toBe(200);
    expect(await usdtBalance(user.id)).toBe(40); // NOT 40 - 60 = -20

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: created.id } });
    expect(tx.status).toBe("COMPLETED");
  });
});

describe("Withdrawal — Reject refunds the debited amount", () => {
  it("Balance 100 -> withdraw 60 -> 40 -> Reject -> FAILED, balance back to 100", async () => {
    const user = await seedVerifiedUser(100);
    loginAs(user);
    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 60, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;
    expect(await usdtBalance(user.id)).toBe(40);

    const admin = await seedAdmin();
    loginAs(admin);
    const rejectRes = await decide(created.id, "REJECT");
    expect(rejectRes.status).toBe(200);
    expect(await usdtBalance(user.id)).toBe(100);

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { id: created.id } });
    expect(tx.status).toBe("FAILED");
  });
});

describe("Withdrawal — double Reject protection", () => {
  it("a second Reject does not refund a second time", async () => {
    const user = await seedVerifiedUser(100);
    loginAs(user);
    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 60, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;

    const admin = await seedAdmin();
    loginAs(admin);
    await decide(created.id, "REJECT");
    expect(await usdtBalance(user.id)).toBe(100);

    const secondReject = await decide(created.id, "REJECT");
    expect(secondReject.status).toBe(400);
    expect(await usdtBalance(user.id)).toBe(100); // unchanged, not 160
  });

  it("Reject then Approve on the same transaction is rejected", async () => {
    const user = await seedVerifiedUser(100);
    loginAs(user);
    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 60, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;

    const admin = await seedAdmin();
    loginAs(admin);
    await decide(created.id, "REJECT");

    const approveAfterReject = await decide(created.id, "APPROVE");
    expect(approveAfterReject.status).toBe(400);
    expect(await usdtBalance(user.id)).toBe(100); // still just the refund, no double-credit
  });
});

describe("Withdrawal — insufficient balance", () => {
  it("Balance 50, withdraw 100 -> error, balance unchanged, no Transaction created", async () => {
    const user = await seedVerifiedUser(50);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount: 100, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(400);
    expect(await usdtBalance(user.id)).toBe(50);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });
});

describe("Withdrawal — invalid amounts are rejected, balance untouched", () => {
  it.each([0, -10, NaN])("rejects amount=%s", async (amount) => {
    const user = await seedVerifiedUser(500);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", { amount, method: "TETHER_USDT" })
    );
    expect(res.status).toBe(422);
    expect(await usdtBalance(user.id)).toBe(500);
  });
});

describe("Security — a plain USER cannot decide transactions", () => {
  it("gets 403 from PATCH /api/admin/transactions/[id]", async () => {
    const user = await seedVerifiedUser(0);
    loginAs(user);
    const res = await deposit(
      jsonRequest("http://test/api/deposit", { amount: 100, method: "TETHER_USDT" })
    );
    const created = (await res.json()).data;

    // Same regular user tries to approve their own deposit.
    const decideRes = await decide(created.id, "APPROVE");
    expect(decideRes.status).toBe(403);
    expect(await usdtBalance(user.id)).toBe(0);
  });

  it("gets 401 with no session at all", async () => {
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
    const res = await decide("nonexistent-id", "APPROVE");
    expect(res.status).toBe(401);
  });
});
