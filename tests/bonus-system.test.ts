/**
 * Combined bonus system — two INDEPENDENT, deposit-approval-triggered
 * promotional wallet credits that may both fire off the same approved
 * deposit because they credit DIFFERENT users:
 *
 *  - FIRST_DEPOSIT_BONUS: 20% of the DEPOSITOR's own first approved
 *    deposit, credited to the depositor, uncapped, once per user ever
 *    (see lib/bonus/first-deposit.ts).
 *  - REFERRAL_BONUS: 10% of a referred user's approved deposit, capped
 *    at 100 USDT, credited to the referrer, once per referred user ever
 *    (see lib/referral/reward.ts).
 *
 * Both are computed ONLY from the original approved deposit amount —
 * never from each other, never recursively from a bonus transaction —
 * and both hook into the exact same PATCH /api/admin/transactions/[id]
 * approval transaction used by tests/deposit-withdrawal-approval.test.ts
 * and tests/referral-system.test.ts. This file exercises the TEST 1-9
 * scenarios from the combined bonus-system spec specifically.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as deposit } from "@/app/api/deposit/route";
import { PATCH as decideTransaction } from "@/app/api/admin/transactions/[id]/route";
import { GET as getHistory } from "@/app/api/history/route";
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

function patchRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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

async function seedAdmin() {
  const admin = await seedUserWithWallet(0);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
  return admin;
}

async function seedReferralPair() {
  const referrer = await seedUserWithWallet(0);
  const referred = await seedUserWithWallet(0);
  await prisma.user.update({
    where: { id: referred.id },
    data: { referredById: referrer.id },
  });
  return { referrer, referred };
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

describe("TEST 1/2 — first-deposit bonus alone (no referrer)", () => {
  it("TEST 1: first approved deposit 250 -> +250 deposit, +50 first-deposit bonus", async () => {
    const user = await seedUserWithWallet(0);
    await depositAndApprove(user, 250);
    expect(await usdtBalance(user.id)).toBe(300); // 250 + 50
    const bonus = await prisma.firstDepositBonus.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(Number(bonus.bonusAmount)).toBe(50);
  });

  it("TEST 2: first approved deposit 500 -> +500 deposit, +100 first-deposit bonus", async () => {
    const user = await seedUserWithWallet(0);
    await depositAndApprove(user, 500);
    expect(await usdtBalance(user.id)).toBe(600); // 500 + 100
  });

  it("2,000 first deposit has NO cap on the 20% bonus: +2,000 deposit, +400 bonus", async () => {
    const user = await seedUserWithWallet(0);
    await depositAndApprove(user, 2000);
    expect(await usdtBalance(user.id)).toBe(2400);
  });
});

describe("TEST 3-6 — both bonuses on the same referred user's first deposit", () => {
  it("TEST 3: referred user deposits 500 -> depositor +600 (500+100 bonus), referrer +50", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);
    expect(await usdtBalance(referred.id)).toBe(600);
    expect(await usdtBalance(referrer.id)).toBe(50);
  });

  it("TEST 4: referred user deposits 1,000 -> depositor +1,200 (1000+200), referrer +100", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 1000);
    expect(await usdtBalance(referred.id)).toBe(1200);
    expect(await usdtBalance(referrer.id)).toBe(100);
  });

  it("TEST 5: referred user deposits 2,000 -> depositor +2,400 (2000+400 uncapped), referrer +100 (capped, NOT 200)", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 2000);
    expect(await usdtBalance(referred.id)).toBe(2400);
    expect(await usdtBalance(referrer.id)).toBe(100);
  });

  it("TEST 6: referred user deposits 10,000 -> depositor +12,000 (10000+2000 uncapped), referrer +100 (capped maximum)", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 10000);
    expect(await usdtBalance(referred.id)).toBe(12000);
    expect(await usdtBalance(referrer.id)).toBe(100);
  });

  it("neither bonus is ever calculated from the other (500 base, not 500+100=600)", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);
    // Referral reward = 500 * 10% = 50, never (500+100 first-deposit
    // bonus) * 10% = 60.
    expect(await usdtBalance(referrer.id)).toBe(50);
  });
});

describe("TEST 7 — rejected deposit doesn't consume the first-deposit bonus", () => {
  it("rejected deposit #1 -> no bonus; approved deposit #2 is treated as the first and gets 20% (+ referral if eligible)", async () => {
    const { referrer, referred } = await seedReferralPair();

    const rejected = await depositAs(referred, 300);
    const admin = await seedAdmin();
    loginAs(admin);
    const rejectRes = await decide(rejected.id, "REJECT");
    expect(rejectRes.status).toBe(200);
    expect(await usdtBalance(referred.id)).toBe(0);
    expect(await prisma.firstDepositBonus.count()).toBe(0);
    expect(await prisma.referralReward.count()).toBe(0);

    await depositAndApprove(referred, 500);
    expect(await usdtBalance(referred.id)).toBe(600); // 500 + 100 first-deposit bonus
    expect(await usdtBalance(referrer.id)).toBe(50); // referral reward still applies
  });
});

describe("TEST 8 — idempotency: approving the same deposit twice", () => {
  it("deposit credit, first-deposit bonus, and referral reward each apply exactly once", async () => {
    const { referrer, referred } = await seedReferralPair();
    const created = await depositAs(referred, 500);

    const admin = await seedAdmin();
    loginAs(admin);
    const first = await decide(created.id, "APPROVE");
    expect(first.status).toBe(200);
    expect(await usdtBalance(referred.id)).toBe(600);
    expect(await usdtBalance(referrer.id)).toBe(50);

    const second = await decide(created.id, "APPROVE");
    expect(second.status).toBe(400); // already-decided guard rejects it outright

    expect(await usdtBalance(referred.id)).toBe(600); // unchanged
    expect(await usdtBalance(referrer.id)).toBe(50); // unchanged
    expect(await prisma.firstDepositBonus.count()).toBe(1);
    expect(await prisma.referralReward.count()).toBe(1);
  });
});

describe("TEST 9 — a second approved deposit never re-triggers either bonus", () => {
  it("depositor gets no second 20% bonus; referrer gets no second referral reward", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);
    expect(await usdtBalance(referred.id)).toBe(600);
    expect(await usdtBalance(referrer.id)).toBe(50);

    await depositAndApprove(referred, 1000);
    // +1000 raw deposit only — no second +200 first-deposit bonus.
    expect(await usdtBalance(referred.id)).toBe(1600);
    // No second referral reward either.
    expect(await usdtBalance(referrer.id)).toBe(50);

    expect(await prisma.firstDepositBonus.count()).toBe(1);
    expect(await prisma.referralReward.count()).toBe(1);
  });
});

describe("Bonus transactions are not deposits, and never recurse", () => {
  it("a FIRST_DEPOSIT_BONUS/REFERRAL_BONUS credit is never itself typed DEPOSIT and cannot re-trigger either bonus", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);

    const depositorTxTypes = (
      await prisma.transaction.findMany({ where: { userId: referred.id } })
    ).map((t) => t.type);
    expect(depositorTxTypes.sort()).toEqual(["DEPOSIT", "FIRST_DEPOSIT_BONUS"]);

    const referrerTxTypes = (
      await prisma.transaction.findMany({ where: { userId: referrer.id } })
    ).map((t) => t.type);
    expect(referrerTxTypes).toEqual(["REFERRAL_BONUS"]);

    // No amount of further activity spontaneously creates more rows —
    // the mechanism only ever runs from inside a real deposit approval.
    expect(await prisma.firstDepositBonus.count()).toBe(1);
    expect(await prisma.referralReward.count()).toBe(1);
  });
});

describe("Transaction history — deposit, first-deposit bonus, and referral bonus are kept separate", () => {
  it("never combined into one inflated Deposit row", async () => {
    const { referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);

    loginAs(referred);
    const rows = (
      await (
        await getHistory(new NextRequest("http://test/api/history?filter=all"))
      ).json()
    ).data as { type: string; amount: string }[];

    const depositRow = rows.find((r) => r.type === "DEPOSIT");
    const bonusRow = rows.find((r) => r.type === "FIRST_DEPOSIT_BONUS");
    expect(depositRow).toBeDefined();
    expect(bonusRow).toBeDefined();
    expect(parseFloat(depositRow!.amount)).toBe(500); // never 600
    expect(parseFloat(bonusRow!.amount)).toBe(100);

    // No single row of type DEPOSIT for 600 exists anywhere.
    expect(rows.some((r) => r.type === "DEPOSIT" && parseFloat(r.amount) === 600)).toBe(
      false
    );
  });
});
