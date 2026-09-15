/**
 * Referral system — registration (code generation, optional referral
 * field, validation, immutable inviter link) and the deposit-triggered
 * signup reward (10% of a referred user's FIRST approved deposit, no
 * minimum, capped at 100 USDT, credited to the referrer's Spot USDT
 * wallet, paid at most once per referred user, never on PENDING/
 * REJECTED deposits — see tests/bonus-system.test.ts for the combined
 * scenarios with the first-deposit bonus that also hooks into the same
 * approval).
 *
 * Same real-auth pattern (real JWT + mocked next/headers cookies jar) as
 * tests/deposit-withdrawal-approval.test.ts, since the reward is hooked
 * into that exact PATCH /api/admin/transactions/[id] flow.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as deposit } from "@/app/api/deposit/route";
import { PATCH as decideTransaction } from "@/app/api/admin/transactions/[id]/route";
import { GET as getHistory } from "@/app/api/history/route";
import { GET as getWeeklyPnl } from "@/app/api/account/weekly-pnl/route";
import { resetDatabase, seedSpotWallet, seedUserWithWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

// Registration (via setAuthCookies) calls .set() on the cookie store to
// establish the new session, not just .get() like an already-authenticated
// request — the mock must support both, or POST /api/auth/register itself
// throws before ever returning a response.
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

function depositRequest(fields: {
  amount: number;
  method: string;
  network: string;
}): NextRequest {
  const form = new FormData();
  form.set("amount", String(fields.amount));
  form.set("method", fields.method);
  form.set("network", fields.network);
  form.set(
    "proof",
    new File([new Uint8Array([1, 2, 3])], "proof.png", { type: "image/png" })
  );
  return new NextRequest("http://test/api/deposit", { method: "POST", body: form });
}

let ipCounter = 0;
function registerRequest(body: Record<string, unknown>): NextRequest {
  ipCounter += 1;
  return new NextRequest("http://test/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
}

function validRegisterBody(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Test",
    lastName: "User",
    email: `reg-${Math.random().toString(36).slice(2)}@test.gtx`,
    password: "Password1",
    agreeToTerms: true,
    ...overrides,
  };
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
  const res = await deposit(
    depositRequest({ amount, method: "TETHER_USDT", network: "BSC" })
  );
  expect(res.status).toBe(201);
  return (await res.json()).data as { id: string };
}

async function depositAndApprove(user: User, amount: number) {
  const created = await depositAs(user, amount);
  const admin = await seedAdmin();
  loginAs(admin);
  const approveRes = await decide(created.id, "APPROVE");
  expect(approveRes.status).toBe(200);
  return created;
}

beforeEach(async () => {
  await resetDatabase();
  mockCookieJar(() => undefined); // anonymous by default, until loginAs() is called
});

afterEach(() => {
  vi.mocked(cookies).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Registration — referral code generation", () => {
  it("A: registers without a referral code -> succeeds, own unique code generated", async () => {
    const email = `a-${Math.random()}@test.gtx`;
    const res = await register(registerRequest(validRegisterBody({ email })));
    expect(res.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.referralCode).toMatch(/^GTX[A-Z0-9]{6}$/);
    expect(user.referredById).toBeNull();
  });

  it("B: registers with a valid (case-insensitive) referral code -> inviter stored", async () => {
    const inviter = await seedUserWithWallet(0);
    const email = `b-${Math.random()}@test.gtx`;

    const res = await register(
      registerRequest(
        validRegisterBody({ email, referralCode: inviter.referralCode.toLowerCase() })
      )
    );
    expect(res.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.referredById).toBe(inviter.id);
  });

  it("C: an invalid referral code rejects registration with a field error, and creates no user", async () => {
    const email = `c-${Math.random()}@test.gtx`;
    const res = await register(
      registerRequest(validRegisterBody({ email, referralCode: "NOPE1234" }))
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.details.referralCode).toEqual(["INVALID_REFERRAL_CODE"]);

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeNull();
  });

  it("D: every created user gets a unique referral code", async () => {
    const email1 = `d1-${Math.random()}@test.gtx`;
    const email2 = `d2-${Math.random()}@test.gtx`;
    await register(registerRequest(validRegisterBody({ email: email1 })));
    await register(registerRequest(validRegisterBody({ email: email2 })));

    const [u1, u2] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: email1 } }),
      prisma.user.findUniqueOrThrow({ where: { email: email2 } }),
    ]);
    expect(u1.referralCode).not.toBe(u2.referralCode);
  });

  it("E: the referral code is stable across reads (nothing regenerates it)", async () => {
    const email = `e-${Math.random()}@test.gtx`;
    await register(registerRequest(validRegisterBody({ email })));

    const first = await prisma.user.findUniqueOrThrow({ where: { email } });
    const second = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(first.referralCode).toBe(second.referralCode);
  });

  it("plain registration without any referral code still works exactly as before", async () => {
    const email = `plain-${Math.random()}@test.gtx`;
    const res = await register(registerRequest(validRegisterBody({ email })));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.user.email).toBe(email);
  });
});

describe("Deposit reward — 10% of the original approved deposit, capped at 100 USDT, no minimum", () => {
  it("F: 250 approved -> inviter receives 25", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 250);
    expect(await usdtBalance(referrer.id)).toBe(25);
  });

  it("G: 500 approved -> inviter receives 50", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);
    expect(await usdtBalance(referrer.id)).toBe(50);
  });

  it("800 approved -> inviter receives 80", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 800);
    expect(await usdtBalance(referrer.id)).toBe(80);
  });

  it("H: 1000 approved -> inviter receives 100", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 1000);
    expect(await usdtBalance(referrer.id)).toBe(100);
  });

  it("no minimum: a small deposit still pays its uncapped 10%", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 50);
    expect(await usdtBalance(referrer.id)).toBe(5);
  });

  it("1,500 approved -> capped at 100, not the raw 150", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 1500);
    expect(await usdtBalance(referrer.id)).toBe(100);
  });

  it("5,000 approved -> still capped at 100, not the raw 500", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 5000);
    expect(await usdtBalance(referrer.id)).toBe(100);
  });

  it("10,000 approved -> still capped at 100, not the raw 1,000", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 10000);
    expect(await usdtBalance(referrer.id)).toBe(100);
  });
});

describe("Deposit reward — only on a genuinely APPROVED deposit", () => {
  it("K: a PENDING deposit pays no reward", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAs(referred, 500);
    expect(await usdtBalance(referrer.id)).toBe(0);
    expect(await prisma.referralReward.count()).toBe(0);
  });

  it("L: a REJECTED deposit pays no reward", async () => {
    const { referrer, referred } = await seedReferralPair();
    const created = await depositAs(referred, 500);

    const admin = await seedAdmin();
    loginAs(admin);
    const rejectRes = await decide(created.id, "REJECT");
    expect(rejectRes.status).toBe(200);

    expect(await usdtBalance(referrer.id)).toBe(0);
    expect(await prisma.referralReward.count()).toBe(0);
  });

  it("M: approving the same deposit twice only pays one reward", async () => {
    const { referrer, referred } = await seedReferralPair();
    const created = await depositAndApprove(referred, 500);
    expect(await usdtBalance(referrer.id)).toBe(50);

    const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    loginAs(admin);
    const secondApprove = await decide(created.id, "APPROVE");
    expect(secondApprove.status).toBe(400); // already-decided guard rejects it outright

    expect(await usdtBalance(referrer.id)).toBe(50); // unchanged, not 100
    expect(await prisma.referralReward.count()).toBe(1);
  });
});

describe("Deposit reward — first qualifying deposit only", () => {
  it("N: a second qualifying deposit from the same referred user pays no second reward", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);
    expect(await usdtBalance(referrer.id)).toBe(50);

    await depositAndApprove(referred, 600);
    expect(await usdtBalance(referrer.id)).toBe(50); // still just 50, not 50+60
    expect(await prisma.referralReward.count()).toBe(1);
  });

  it("O: the referred user's FIRST deposit (however small) consumes the referral reward slot — a larger second deposit pays nothing extra", async () => {
    const { referrer, referred } = await seedReferralPair();
    const first = await depositAndApprove(referred, 100);
    expect(await usdtBalance(referrer.id)).toBe(10); // 100 * 10%, no minimum

    await depositAndApprove(referred, 500);
    expect(await usdtBalance(referrer.id)).toBe(10); // unchanged — not 10+50

    const reward = await prisma.referralReward.findUniqueOrThrow({
      where: { referredUserId: referred.id },
    });
    expect(reward.depositTransactionId).toBe(first.id);
  });
});

describe("Deposit reward — no referrer, no reward", () => {
  it("P: a non-referred user's qualifying deposit pays no one", async () => {
    const user = await seedUserWithWallet(0);
    await depositAndApprove(user, 500);
    expect(await prisma.referralReward.count()).toBe(0);
  });
});

describe("Deposit reward — self-referral is refused even if forced at the data level", () => {
  it("a user whose referredById somehow equals themselves is never rewarded", async () => {
    const user = await seedUserWithWallet(0);
    await prisma.user.update({ where: { id: user.id }, data: { referredById: user.id } });

    await depositAndApprove(user, 500);
    // Their own deposit + their own first-deposit bonus (500 + 100) —
    // no EXTRA +50 self-referral reward on top of that.
    expect(await usdtBalance(user.id)).toBe(600);
    expect(await prisma.referralReward.count()).toBe(0);
  });
});

describe("Deposit reward — visible in history, invisible to weekly asset P/L", () => {
  it("Q: the referral bonus appears in the referrer's transaction history as REFERRAL_BONUS", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);

    loginAs(referrer);
    const historyRes = await getHistory(
      new NextRequest("http://test/api/history?filter=all")
    );
    const rows = (await historyRes.json()).data as { type: string; amount: string }[];
    const bonusRow = rows.find((r) => r.type === "REFERRAL_BONUS");
    expect(bonusRow).toBeDefined();
    expect(parseFloat(bonusRow!.amount)).toBe(50);
  });

  it("R: the referral bonus does not affect the referrer's weekly asset P/L", async () => {
    const { referrer, referred } = await seedReferralPair();
    await depositAndApprove(referred, 500);
    expect(await usdtBalance(referrer.id)).toBe(50);

    loginAs(referrer);
    const pnlRes = await getWeeklyPnl();
    const pnlJson = (await pnlRes.json()).data as { pnl: number; percent: number };
    expect(pnlJson).toEqual({ pnl: 0, percent: 0 });
  });
});

describe("Referral relationship — never USDT deposit/withdrawal itself", () => {
  it("a plain (non-referred) deposit/approval never creates a SpotWallet credit for anyone but the depositor", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    await depositAndApprove(user, 500);
    expect(await usdtBalance(user.id)).toBe(600); // 500 deposit + their own 100 first-deposit bonus
    expect(await prisma.referralReward.count()).toBe(0);
  });
});

/** Directly inserts a COMPLETED deposit Transaction row, bypassing the
 *  approval API entirely — simulates a deposit that completed before this
 *  exact code path (or before the referral feature) ever ran for this
 *  referred user, which is exactly the historical-first-deposit bug
 *  scenario: an old COMPLETED deposit with no ReferralReward row, since
 *  tryAwardReferralSignupBonus was never invoked for it. Mirrors
 *  tests/first-deposit-bonus-history.test.ts's own seedHistoricalCompletedDeposit
 *  for the equivalent first-deposit-bonus fix. */
async function seedHistoricalCompletedDeposit(
  userId: string,
  amount: number,
  createdAt: Date
) {
  return prisma.transaction.create({
    data: { userId, type: "DEPOSIT", amount, status: "COMPLETED", createdAt },
  });
}

describe("Deposit reward — historical first deposit (re-derived from Transaction history, not from 'no ReferralReward row yet')", () => {
  it("a referred user with an old COMPLETED deposit already on record gets NO referral reward on a later approved deposit", async () => {
    const { referrer, referred } = await seedReferralPair();
    // Old deposit, long before this test's "new" one — never went through
    // tryAwardReferralSignupBonus, so no ReferralReward row exists yet.
    await seedHistoricalCompletedDeposit(
      referred.id,
      250,
      new Date("2026-08-31T00:00:00Z")
    );

    await depositAndApprove(referred, 100000);

    expect(await usdtBalance(referrer.id)).toBe(0);
    expect(await prisma.referralReward.count()).toBe(0);
  });

  it("does NOT retroactively reward the historical deposit's own amount either — the slot is simply never claimed", async () => {
    const { referrer, referred } = await seedReferralPair();
    await seedHistoricalCompletedDeposit(
      referred.id,
      250,
      new Date("2026-08-31T00:00:00Z")
    );
    await depositAndApprove(referred, 500);

    expect(await usdtBalance(referrer.id)).toBe(0); // never 25 (10% of the 250 historical one)
    expect(await prisma.referralReward.count()).toBe(0);
  });
});

describe("Deposit reward — concurrent approval requests", () => {
  it("two simultaneous APPROVE requests for the same deposit pay the referral reward at most once", async () => {
    const { referrer, referred } = await seedReferralPair();
    const created = await depositAs(referred, 500);

    const admin = await seedAdmin();
    loginAs(admin);

    const [first, second] = await Promise.all([
      decide(created.id, "APPROVE"),
      decide(created.id, "APPROVE"),
    ]);
    const statuses = [first.status, second.status].sort();
    // Exactly one of the two concurrent requests wins the PENDING->COMPLETED
    // transition (the guarded updateMany in the approval route); the other
    // finds zero rows still PENDING and gets the 400 NotDecidableError.
    expect(statuses).toEqual([200, 400]);

    expect(await usdtBalance(referrer.id)).toBe(50); // not 100
    expect(await prisma.referralReward.count()).toBe(1);
  });
});
