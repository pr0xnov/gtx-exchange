/**
 * IP-based anti-abuse layer for the +20% first-deposit bonus
 * (lib/bonus/first-deposit.ts) — a free, no-third-party-service fraud
 * signal on top of the existing bonus mechanism tested in
 * tests/bonus-system.test.ts. Covers:
 *
 *  - two different accounts claiming from the same recorded IP: the
 *    first is paid, the second is flagged for review instead of
 *    auto-credited
 *  - the underlying deposit itself is ALWAYS credited normally,
 *    regardless of the anti-abuse outcome
 *  - a missing/unverifiable IP never blocks a legitimate bonus
 *    (fail-open)
 *  - IPv6 /64-prefix bucketing (two different addresses in the same
 *    household prefix collide; two addresses in different prefixes
 *    don't)
 *  - the claim row's own idempotency guarantee still holds for a
 *    flagged (unpaid) claim
 *  - referral bonuses are untouched by any of this
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeIp } from "@/lib/security/client-ip";
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

/** Seeds a user with lastKnownIp set exactly as register/login would have
 *  stored it — passed through normalizeIp(), never the raw address, so
 *  these tests exercise the real stored representation (e.g. an IPv6
 *  address collapses to its "ipv6:<64-bit prefix>" bucket key). */
async function seedUserWithIp(ip: string | null) {
  const user = await seedUserWithWallet(0);
  return prisma.user.update({
    where: { id: user.id },
    data: { lastKnownIp: ip ? normalizeIp(ip) : null },
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

describe("same recorded IP across two different accounts", () => {
  it("first account is paid the 20% bonus normally", async () => {
    const userA = await seedUserWithIp("203.0.113.10");
    await depositAndApprove(userA, 500);
    expect(await usdtBalance(userA.id)).toBe(600); // 500 + 100 bonus

    const bonusA = await prisma.firstDepositBonus.findUniqueOrThrow({
      where: { userId: userA.id },
    });
    expect(bonusA.bonusTransactionId).not.toBeNull();
    expect(bonusA.reviewReason).toBeNull();
    expect(bonusA.claimIp).toBe("203.0.113.10");
  });

  it("second account from the same IP is flagged instead of auto-paid, but its deposit still credits in full", async () => {
    const userA = await seedUserWithIp("203.0.113.10");
    const userB = await seedUserWithIp("203.0.113.10");

    await depositAndApprove(userA, 500);
    await depositAndApprove(userB, 400);

    // The real deposit is ALWAYS credited normally — no bonus, just the
    // 400 itself.
    expect(await usdtBalance(userB.id)).toBe(400);

    const bonusB = await prisma.firstDepositBonus.findUniqueOrThrow({
      where: { userId: userB.id },
    });
    expect(bonusB.bonusTransactionId).toBeNull();
    expect(bonusB.reviewReason).toBe("DUPLICATE_IP");
    expect(bonusB.claimIp).toBe("203.0.113.10");
    // No FIRST_DEPOSIT_BONUS transaction was ever created for userB.
    const txTypes = (
      await prisma.transaction.findMany({ where: { userId: userB.id } })
    ).map((t) => t.type);
    expect(txTypes).toEqual(["DEPOSIT"]);
  });

  it("order doesn't matter: whichever account is APPROVED first keeps the bonus", async () => {
    const userA = await seedUserWithIp("198.51.100.5");
    const userB = await seedUserWithIp("198.51.100.5");

    const depositB = await depositAs(userB, 300);
    const depositA = await depositAs(userA, 300);
    await approve(depositB.id); // B approved first this time
    await approve(depositA.id);

    expect(await usdtBalance(userB.id)).toBe(360); // 300 + 60, paid
    expect(await usdtBalance(userA.id)).toBe(300); // flagged, deposit only
  });

  it("a flagged claim can never be retroactively paid by a second deposit (idempotency holds)", async () => {
    const userA = await seedUserWithIp("203.0.113.10");
    const userB = await seedUserWithIp("203.0.113.10");
    await depositAndApprove(userA, 500);
    await depositAndApprove(userB, 400); // flagged

    await depositAndApprove(userB, 1000); // second-ever approved deposit for B
    expect(await usdtBalance(userB.id)).toBe(1400); // 400 + 1000, still no bonus
    expect(await prisma.firstDepositBonus.count({ where: { userId: userB.id } })).toBe(1);
  });
});

describe("different recorded IPs never collide", () => {
  it("two accounts on different IPs both get paid in full", async () => {
    const userA = await seedUserWithIp("203.0.113.10");
    const userB = await seedUserWithIp("203.0.113.11");

    await depositAndApprove(userA, 500);
    await depositAndApprove(userB, 500);

    expect(await usdtBalance(userA.id)).toBe(600);
    expect(await usdtBalance(userB.id)).toBe(600);
  });
});

describe("missing/unverifiable IP never blocks a legitimate bonus (fail-open)", () => {
  it("a user with no recorded IP is paid normally", async () => {
    const user = await seedUserWithIp(null);
    await depositAndApprove(user, 500);
    expect(await usdtBalance(user.id)).toBe(600);

    const bonus = await prisma.firstDepositBonus.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(bonus.bonusTransactionId).not.toBeNull();
    expect(bonus.claimIp).toBeNull();
  });

  it("two different users both missing an IP never collide with each other", async () => {
    const userA = await seedUserWithIp(null);
    const userB = await seedUserWithIp(null);
    await depositAndApprove(userA, 500);
    await depositAndApprove(userB, 500);
    expect(await usdtBalance(userA.id)).toBe(600);
    expect(await usdtBalance(userB.id)).toBe(600);
  });
});

describe("IPv6 /64-prefix bucketing", () => {
  it("two different addresses within the same /64 are treated as the same connection", async () => {
    const userA = await seedUserWithIp("2001:db8:1234:5678:aaaa:bbbb:cccc:0001");
    const userB = await seedUserWithIp("2001:db8:1234:5678:ffff:eeee:dddd:0002");

    await depositAndApprove(userA, 500);
    await depositAndApprove(userB, 400);

    expect(await usdtBalance(userA.id)).toBe(600);
    expect(await usdtBalance(userB.id)).toBe(400); // flagged
    const bonusB = await prisma.firstDepositBonus.findUniqueOrThrow({
      where: { userId: userB.id },
    });
    expect(bonusB.reviewReason).toBe("DUPLICATE_IP");
  });

  it("addresses in different /64 prefixes never collide", async () => {
    const userA = await seedUserWithIp("2001:db8:1111:0000:aaaa:bbbb:cccc:0001");
    const userB = await seedUserWithIp("2001:db8:2222:0000:aaaa:bbbb:cccc:0001");

    await depositAndApprove(userA, 500);
    await depositAndApprove(userB, 400);

    expect(await usdtBalance(userA.id)).toBe(600);
    expect(await usdtBalance(userB.id)).toBe(480); // paid normally
  });
});

describe("real deposit credit is never affected by the anti-abuse outcome", () => {
  it("a flagged user's deposit still shows COMPLETED and full amount in history", async () => {
    const userA = await seedUserWithIp("203.0.113.10");
    const userB = await seedUserWithIp("203.0.113.10");
    await depositAndApprove(userA, 500);
    const createdB = await depositAndApprove(userB, 777);

    const txn = await prisma.transaction.findUniqueOrThrow({
      where: { id: createdB.id },
    });
    expect(txn.status).toBe("COMPLETED");
    expect(Number(txn.amount)).toBe(777);
  });
});

describe("referral bonuses are unaffected by the first-deposit anti-abuse check", () => {
  it("a referred user flagged for duplicate-IP first-deposit bonus still pays their referrer the normal 10%", async () => {
    const referrer = await seedUserWithWallet(0);
    const userA = await seedUserWithIp("203.0.113.10"); // consumes the IP first
    await depositAndApprove(userA, 500);

    const referred = await seedUserWithWallet(0);
    await prisma.user.update({
      where: { id: referred.id },
      data: { referredById: referrer.id, lastKnownIp: normalizeIp("203.0.113.10") },
    });
    await depositAndApprove(referred, 500);

    expect(await usdtBalance(referred.id)).toBe(500); // flagged: no first-deposit bonus
    expect(await usdtBalance(referrer.id)).toBe(50); // referral reward still pays in full
  });
});
