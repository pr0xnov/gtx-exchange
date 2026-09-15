/**
 * Regression coverage for a real bug: lib/bonus/first-deposit.ts used to
 * treat "this user has never claimed a FirstDepositBonus row" as proof
 * their next approved deposit was their first ever — which is wrong for
 * any account that already had a COMPLETED deposit before this feature
 * existed (or before this particular approval), since no FirstDepositBonus
 * row existed for them yet either way. The fix re-derives "is this really
 * the user's earliest COMPLETED deposit" from Transaction history on every
 * call. This file exercises the five scenarios called out in that fix's
 * own spec (A-E); tests/bonus-system.test.ts already covers the general
 * bonus-system behavior — this file is specifically about the
 * history-aware "first deposit" determination.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as deposit } from "@/app/api/deposit/route";
import { PATCH as decideTransaction } from "@/app/api/admin/transactions/[id]/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function mockCookieJar(
  get: (name: string) => { name: string; value: string } | undefined
) {
  vi.mocked(cookies).mockResolvedValue({ get, set: vi.fn(), delete: vi.fn() } as never);
}

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  mockCookieJar((name) => (name === ACCESS_COOKIE ? { name, value: token } : undefined));
}

function depositRequest(amount: number): NextRequest {
  const form = new FormData();
  form.set("amount", String(amount));
  form.set("method", "TETHER_USDT");
  form.set("network", "BSC");
  form.set(
    "proof",
    new File([new Uint8Array([1, 2, 3])], "proof.png", { type: "image/png" })
  );
  return new NextRequest("http://test/api/deposit", { method: "POST", body: form });
}

function patchRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
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

function decide(id: string, decision: "APPROVE" | "REJECT") {
  return decideTransaction(
    patchRequest(`http://test/api/admin/transactions/${id}`, { decision }),
    { params: Promise.resolve({ id }) }
  );
}

async function depositAs(user: User, amount: number) {
  loginAs(user);
  const res = await deposit(depositRequest(amount));
  expect(res.status).toBe(201);
  return (await res.json()).data as { id: string };
}

async function approve(id: string) {
  const admin = await seedAdmin();
  loginAs(admin);
  const res = await decide(id, "APPROVE");
  expect(res.status).toBe(200);
  return res;
}

async function depositAndApprove(user: User, amount: number) {
  const created = await depositAs(user, amount);
  await approve(created.id);
  return created;
}

async function usdtBalance(userId: string): Promise<number> {
  const wallet = await prisma.spotWallet.findUnique({
    where: { userId_currency: { userId, currency: "USDT" } },
  });
  return Number(wallet?.balance ?? 0);
}

/** Directly inserts a COMPLETED deposit Transaction row, bypassing the
 *  approval API entirely — simulates a deposit that was completed before
 *  the FirstDepositBonus feature existed (or before any current code
 *  path ran), which is exactly the real-world bug scenario: an old
 *  COMPLETED deposit with no linked FirstDepositBonus row. */
async function seedHistoricalCompletedDeposit(
  userId: string,
  amount: number,
  createdAt: Date
) {
  return prisma.transaction.create({
    data: { userId, type: "DEPOSIT", amount, status: "COMPLETED", createdAt },
  });
}

beforeEach(async () => {
  await resetDatabase();
  mockCookieJar(() => undefined);
});

afterEach(() => {
  vi.mocked(cookies).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("A — brand-new user: first approved deposit gets +20%", () => {
  it("pays the bonus", async () => {
    const user = await seedUserWithWallet(0);
    await depositAndApprove(user, 500);
    expect(await usdtBalance(user.id)).toBe(600); // 500 + 100 (20%)
  });
});

describe("B — existing user with an old approved deposit: new approved deposit gets NO bonus", () => {
  it("does not pay the bonus on a later deposit when an earlier COMPLETED one already exists", async () => {
    const user = await seedUserWithWallet(0);
    // Old deposit, long before this test's "new" one — never went through
    // tryAwardFirstDepositBonus, so no FirstDepositBonus row exists yet.
    await seedHistoricalCompletedDeposit(user.id, 250, new Date("2026-08-31T00:00:00Z"));

    await depositAndApprove(user, 100000);

    // Only the raw deposit itself — no +20000 bonus.
    expect(await usdtBalance(user.id)).toBe(100000);
    expect(await prisma.firstDepositBonus.count({ where: { userId: user.id } })).toBe(0);
  });

  it("matches the exact reported bug scenario: 250 on 31/08, then 100000 on 05/09 — no bonus on either", async () => {
    const user = await seedUserWithWallet(0);
    await seedHistoricalCompletedDeposit(user.id, 250, new Date("2026-08-31T00:00:00Z"));

    await depositAndApprove(user, 100000);

    expect(await usdtBalance(user.id)).toBe(100000); // never 120000
    expect(
      await prisma.transaction.count({
        where: { userId: user.id, type: "FIRST_DEPOSIT_BONUS" },
      })
    ).toBe(0);
  });
});

describe("C — rejected first request then approved deposit: the approved one qualifies", () => {
  it("pays the bonus on the first APPROVED deposit even if an earlier one was rejected", async () => {
    const user = await seedUserWithWallet(0);
    const rejected = await depositAs(user, 300);
    const admin = await seedAdmin();
    loginAs(admin);
    await decide(rejected.id, "REJECT");

    await depositAndApprove(user, 500);
    expect(await usdtBalance(user.id)).toBe(600); // 500 + 100 (20%)
  });
});

describe("D — two approved deposits: only the first gets the bonus", () => {
  it("the second approved deposit never pays a second bonus", async () => {
    const user = await seedUserWithWallet(0);
    await depositAndApprove(user, 500);
    expect(await usdtBalance(user.id)).toBe(600);

    await depositAndApprove(user, 1000);
    expect(await usdtBalance(user.id)).toBe(1600); // +1000 raw only
    expect(await prisma.firstDepositBonus.count({ where: { userId: user.id } })).toBe(1);
  });
});

describe("E — retry approval: the bonus is paid at most once", () => {
  it("a second PATCH on the same transaction changes nothing", async () => {
    const user = await seedUserWithWallet(0);
    const created = await depositAs(user, 500);
    const admin = await seedAdmin();
    loginAs(admin);

    const first = await decide(created.id, "APPROVE");
    expect(first.status).toBe(200);
    expect(await usdtBalance(user.id)).toBe(600);

    const second = await decide(created.id, "APPROVE");
    expect(second.status).toBe(400); // already-decided guard

    expect(await usdtBalance(user.id)).toBe(600); // unchanged
    expect(await prisma.firstDepositBonus.count({ where: { userId: user.id } })).toBe(1);
  });
});
