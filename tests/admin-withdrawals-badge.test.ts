/**
 * Withdrawals badge correctness on /admin/users/[id] — the exact bug
 * report this task exists to fix: the badge (a separate, unbounded,
 * status-only query in lib/admin/user-summary.ts's
 * batchUnreadRequestCounts) was already correctly PENDING-only, but the
 * Deposits/Withdrawals *tables* on the same page were sliced from one
 * shared `transaction.findMany({ where: { userId }, take: 50 })` query
 * covering every TransactionType — so a genuinely PENDING withdrawal
 * could quietly scroll out of that shared top-50 window whenever the same
 * user also had many other transactions (deposits, admin balance
 * adjustments, bonuses, or just older withdrawals), making the badge look
 * "wrong" even though it was the table that was incomplete.
 *
 * Exercises the real route end to end (real JWT + real requireAdmin())
 * via a mocked next/headers cookies() jar, same pattern as
 * tests/admin-balance-adjustment.test.ts.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { GET as unreadCount } from "@/app/api/admin/unread-count/route";
import { GET as userDetail } from "@/app/api/admin/users/[id]/route";
import { PATCH as decideTransaction } from "@/app/api/admin/transactions/[id]/route";
import { resetDatabase, seedUserWithWallet, seedSpotWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
}

function patchRequest(body: unknown): NextRequest {
  return new NextRequest("http://test/x", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function seedAdmin() {
  const admin = await seedUserWithWallet(0);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
  return admin;
}

async function readJson<T = unknown>(res: Response) {
  return (await res.json()) as { success: boolean; data?: T; error?: string };
}

interface TransactionRow {
  id: string;
  type: string;
  status: string;
}

interface UserDetail {
  unread: { deposits: number; withdrawals: number; verification: number };
  transactions: TransactionRow[];
}

async function getDetail(userId: string) {
  return readJson<UserDetail>(
    await userDetail(new NextRequest("http://test/x"), {
      params: Promise.resolve({ id: userId }),
    })
  );
}

async function getUnreadTotal(): Promise<number> {
  return (await readJson<{ total: number }>(await unreadCount())).data!.total;
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

describe("Withdrawals badge — many COMPLETED/FAILED, zero PENDING", () => {
  it("shows no badge (0), matching the exact reported scenario", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });

    const amounts = [10_000, 3_000, 5_000, 50, 50, 500];
    for (const amount of amounts) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          asset: "USDT",
          status: amount % 2 === 0 ? "COMPLETED" : "FAILED",
        },
      });
    }
    loginAs(admin);

    const detail = await getDetail(user.id);
    expect(detail.data!.unread.withdrawals).toBe(0);

    const visibleWithdrawals = detail.data!.transactions.filter(
      (t) => t.type === "WITHDRAWAL"
    );
    expect(visibleWithdrawals.every((t) => t.status !== "PENDING")).toBe(true);
  });
});

describe("Withdrawals badge — a real PENDING request survives high unrelated transaction volume", () => {
  it("stays visible in the table and counted in the badge even after 60 newer, unrelated transactions", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });

    const pendingWithdrawal = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        amount: 100,
        asset: "USDT",
        status: "PENDING",
      },
    });

    // 60 newer, unrelated (DEPOSIT) transactions — enough to have pushed
    // the withdrawal above out of a shared top-50-of-any-type window.
    for (let i = 0; i < 60; i++) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          amount: 1,
          asset: "USDT",
          status: "COMPLETED",
        },
      });
    }
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(1);

    const detail = await getDetail(user.id);
    expect(detail.data!.unread.withdrawals).toBe(1);
    const visibleWithdrawals = detail.data!.transactions.filter(
      (t) => t.type === "WITHDRAWAL"
    );
    expect(visibleWithdrawals.some((t) => t.id === pendingWithdrawal.id)).toBe(true);
  });
});

describe("Withdrawals badge — lifecycle", () => {
  it("PENDING -> badge 1 -> Approve -> COMPLETED -> badge 0", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100 });
    const withdrawal = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        amount: 50,
        asset: "USDT",
        status: "PENDING",
      },
    });
    loginAs(admin);

    expect((await getDetail(user.id)).data!.unread.withdrawals).toBe(1);

    await decideTransaction(patchRequest({ decision: "APPROVE" }), {
      params: Promise.resolve({ id: withdrawal.id }),
    });

    expect((await getDetail(user.id)).data!.unread.withdrawals).toBe(0);
    expect(await getUnreadTotal()).toBe(0);
  });

  it("PENDING -> badge 1 -> Reject -> FAILED -> badge 0", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100 });
    const withdrawal = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        amount: 50,
        asset: "USDT",
        status: "PENDING",
      },
    });
    loginAs(admin);

    expect((await getDetail(user.id)).data!.unread.withdrawals).toBe(1);

    await decideTransaction(patchRequest({ decision: "REJECT" }), {
      params: Promise.resolve({ id: withdrawal.id }),
    });

    expect((await getDetail(user.id)).data!.unread.withdrawals).toBe(0);
    expect(await getUnreadTotal()).toBe(0);
  });
});

describe("Withdrawals badge — unaffected by other request types", () => {
  it("a PENDING Deposit does not increase the Withdrawals badge", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: 100,
        asset: "USDT",
        status: "PENDING",
      },
    });
    loginAs(admin);

    const detail = await getDetail(user.id);
    expect(detail.data!.unread.withdrawals).toBe(0);
    expect(detail.data!.unread.deposits).toBe(1);
  });

  it("a PENDING Verification does not increase the Withdrawals badge", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await prisma.verificationDocument.create({
      data: { userId: user.id, type: "IDENTITY", fileName: "id.png" },
    });
    loginAs(admin);

    const detail = await getDetail(user.id);
    expect(detail.data!.unread.withdrawals).toBe(0);
    expect(detail.data!.unread.verification).toBe(1);
  });
});
