/**
 * The star feature: POST /api/admin/balance-adjustments. Covers exactly
 * what section 29 of this task's own spec asks for — balance adjustment,
 * transaction creation, audit log, atomic rollback, and unauthorized
 * rejection — against the real route handler and a real test DB.
 *
 * Auth is exercised end to end (real JWT + real requireAdmin() role
 * check), not stubbed — see tests/admin-authorization.test.ts's own doc
 * comment for why mocking lib/auth/session's exports directly doesn't
 * actually intercept requireAdmin()'s internal call to requireUser().
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as adjustBalance } from "@/app/api/admin/balance-adjustments/route";
import {
  resetDatabase,
  seedUserWithWallet,
  seedSpotWallet,
  jsonRequest,
} from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/email/mailer", () => ({ sendMail: vi.fn().mockResolvedValue(true) }));

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
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

async function seedAdmin() {
  const admin = await seedUserWithWallet(0);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
  return admin;
}

function adjustRequest(body: unknown) {
  return jsonRequest("http://test/api/admin/balance-adjustments", body);
}

describe("Balance Adjustment — CREDIT", () => {
  it("credits the SpotWallet, creates a Transaction, a BalanceAdjustment, and an AuditLog entry", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: target.id, currency: "USDT", balance: 100 });
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "USDT",
        amount: 1000,
        direction: "CREDIT",
        reason: "Manual balance adjustment",
      })
    );
    expect(res.status).toBe(201);

    const wallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: target.id, currency: "USDT" } },
    });
    expect(Number(wallet!.balance)).toBe(1100);

    const transactions = await prisma.transaction.findMany({
      where: { userId: target.id },
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]!.type).toBe("ADMIN_BALANCE_ADJUSTMENT");
    expect(transactions[0]!.direction).toBe("CREDIT");
    expect(Number(transactions[0]!.amount)).toBe(1000);
    expect(transactions[0]!.asset).toBe("USDT");

    const adjustments = await prisma.balanceAdjustment.findMany({
      where: { userId: target.id },
    });
    expect(adjustments).toHaveLength(1);
    expect(adjustments[0]!.adminId).toBe(admin.id);
    expect(adjustments[0]!.reason).toBe("Manual balance adjustment");
    expect(adjustments[0]!.transactionId).toBe(transactions[0]!.id);

    const auditEntries = await prisma.auditLog.findMany({
      where: { action: "ADMIN_BALANCE_ADJUSTMENT", targetUserId: target.id },
    });
    expect(auditEntries).toHaveLength(1);
    expect(auditEntries[0]!.adminId).toBe(admin.id);
  });

  it("also credits a non-USDT asset (BTC) correctly", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "BTC",
        amount: 0.5,
        direction: "CREDIT",
        reason: "Manual BTC credit",
      })
    );
    expect(res.status).toBe(201);

    const wallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: target.id, currency: "BTC" } },
    });
    expect(Number(wallet!.balance)).toBe(0.5);
  });
});

describe("Balance Adjustment — DEBIT", () => {
  it("debits the SpotWallet and records the transaction/audit trail", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: target.id, currency: "USDT", balance: 500 });
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "USDT",
        amount: 200,
        direction: "DEBIT",
        reason: "Correction",
      })
    );
    expect(res.status).toBe(201);

    const wallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: target.id, currency: "USDT" } },
    });
    expect(Number(wallet!.balance)).toBe(300);

    const transactions = await prisma.transaction.findMany({
      where: { userId: target.id },
    });
    expect(transactions[0]!.direction).toBe("DEBIT");
  });

  it("rejects a DEBIT larger than the available balance — atomic rollback, nothing written", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: target.id, currency: "USDT", balance: 50 });
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "USDT",
        amount: 100,
        direction: "DEBIT",
        reason: "Too much",
      })
    );
    expect(res.status).toBe(400);

    // Balance untouched...
    const wallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: target.id, currency: "USDT" } },
    });
    expect(Number(wallet!.balance)).toBe(50);

    // ...and no partial Transaction/BalanceAdjustment/AuditLog rows were
    // left behind by the rolled-back transaction — this is the "balance
    // changed but transaction didn't (or vice versa)" scenario the spec
    // explicitly calls out as forbidden.
    expect(await prisma.transaction.count()).toBe(0);
    expect(await prisma.balanceAdjustment.count()).toBe(0);
    expect(
      await prisma.auditLog.count({ where: { action: "ADMIN_BALANCE_ADJUSTMENT" } })
    ).toBe(0);
  });
});

describe("Balance Adjustment — authorization and validation", () => {
  it("a plain USER is rejected with 403 and no balance change", async () => {
    const plainUser = await seedUserWithWallet(0);
    const target = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: target.id, currency: "USDT", balance: 100 });
    loginAs(plainUser);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "USDT",
        amount: 100,
        direction: "CREDIT",
        reason: "Should not happen",
      })
    );
    expect(res.status).toBe(403);

    const wallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: target.id, currency: "USDT" } },
    });
    expect(Number(wallet!.balance)).toBe(100);
  });

  it("rejects a zero amount", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "USDT",
        amount: 0,
        direction: "CREDIT",
        reason: "Testing validation",
      })
    );
    expect(res.status).toBe(422);
  });

  it("rejects a negative amount", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "USDT",
        amount: -50,
        direction: "CREDIT",
        reason: "Testing validation",
      })
    );
    expect(res.status).toBe(422);
  });

  it("rejects an unknown asset", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "DOGECOIN2",
        amount: 10,
        direction: "CREDIT",
        reason: "Testing validation",
      })
    );
    expect(res.status).toBe(422);
  });

  it("rejects a missing reason", async () => {
    const admin = await seedAdmin();
    const target = await seedUserWithWallet(0);
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: target.id,
        asset: "USDT",
        amount: 10,
        direction: "CREDIT",
        reason: "",
      })
    );
    expect(res.status).toBe(422);
  });

  it("rejects an unknown user", async () => {
    const admin = await seedAdmin();
    loginAs(admin);

    const res = await adjustBalance(
      adjustRequest({
        userId: "does-not-exist",
        asset: "USDT",
        amount: 10,
        direction: "CREDIT",
        reason: "No such user",
      })
    );
    expect(res.status).toBe(404);
  });
});
