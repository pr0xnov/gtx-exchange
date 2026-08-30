/**
 * Admin Panel "requires admin action" badges (Verification/Deposit/
 * Withdrawal) at all three levels: sidebar total (GET /api/admin/unread-
 * count), per-user (GET /api/admin/users), and per-section on a user's
 * own detail page (GET /api/admin/users/[id]).
 *
 * Badge meaning is a pure `status === "PENDING"` count — see
 * lib/admin/user-summary.ts's batchUnreadRequestCounts doc comment.
 * Merely opening a page/section (GET /api/admin/users, GET
 * /api/admin/users/[id], GET /api/admin/verification/[userId]) must never
 * change it; only an actual Approve/Reject decision (which flips status
 * away from PENDING) does. This deliberately replaces an earlier "seen"/
 * unread-messages framing of the same badges — see git history for that
 * removed adminViewedAt-tracking behavior.
 *
 * Exercises the real routes end to end (real JWT + real requireAdmin())
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
import { GET as listUsers } from "@/app/api/admin/users/route";
import { GET as userDetail } from "@/app/api/admin/users/[id]/route";
import { PATCH as decideTransaction } from "@/app/api/admin/transactions/[id]/route";
import {
  GET as verificationDetail,
  PATCH as decideVerification,
} from "@/app/api/admin/verification/[userId]/route";
import { resetDatabase, seedUserWithWallet, seedSpotWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
}

function loggedOut() {
  vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
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

async function createPendingDeposit(userId: string, amount = 100) {
  return prisma.transaction.create({
    data: { userId, type: "DEPOSIT", amount, asset: "USDT", status: "PENDING" },
  });
}

async function createPendingWithdrawal(userId: string, amount = 50) {
  return prisma.transaction.create({
    data: { userId, type: "WITHDRAWAL", amount, asset: "USDT", status: "PENDING" },
  });
}

async function readJson<T = unknown>(res: Response) {
  return (await res.json()) as { success: boolean; data?: T; error?: string };
}

interface UserRow {
  id: string;
  unreadCount: number;
}

interface UnreadCounts {
  deposits: number;
  withdrawals: number;
  verification: number;
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

describe("Badges — new PENDING requests increment every level", () => {
  it("a new PENDING deposit shows up in the sidebar total, the users list, and the user's own detail", async () => {
    const admin = await seedAdmin();
    const userA = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: userA.id, currency: "USDT", balance: 0 });
    await createPendingDeposit(userA.id);
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(1);

    const list = await readJson<{ users: UserRow[] }>(
      await listUsers(new NextRequest("http://test/api/admin/users"))
    );
    const rowA = list.data!.users.find((u) => u.id === userA.id)!;
    expect(rowA.unreadCount).toBe(1);

    const detail = await readJson<{ unread: UnreadCounts }>(
      await userDetail(new NextRequest("http://test/api/admin/users/" + userA.id), {
        params: Promise.resolve({ id: userA.id }),
      })
    );
    expect(detail.data!.unread).toEqual({ deposits: 1, withdrawals: 0, verification: 0 });
  });

  it("multiple request types on one user, plus another user, aggregate correctly", async () => {
    const admin = await seedAdmin();
    const userA = await seedUserWithWallet(0);
    const userB = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: userA.id, currency: "USDT", balance: 0 });
    await seedSpotWallet({ userId: userB.id, currency: "USDT", balance: 0 });

    await createPendingDeposit(userA.id, 10);
    await createPendingDeposit(userA.id, 20);
    await prisma.verificationDocument.create({
      data: { userId: userA.id, type: "IDENTITY", fileName: "id.png" },
    });
    await createPendingWithdrawal(userB.id);
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(4); // 2 deposits + 1 verification + 1 withdrawal

    const list = await readJson<{ users: UserRow[] }>(
      await listUsers(new NextRequest("http://test/api/admin/users"))
    );
    const rowA = list.data!.users.find((u) => u.id === userA.id)!;
    const rowB = list.data!.users.find((u) => u.id === userB.id)!;
    expect(rowA.unreadCount).toBe(3);
    expect(rowB.unreadCount).toBe(1);

    const detailA = await readJson<{ unread: UnreadCounts }>(
      await userDetail(new NextRequest("http://test/x"), {
        params: Promise.resolve({ id: userA.id }),
      })
    );
    expect(detailA.data!.unread).toEqual({
      deposits: 2,
      withdrawals: 0,
      verification: 1,
    });

    const detailB = await readJson<{ unread: UnreadCounts }>(
      await userDetail(new NextRequest("http://test/x"), {
        params: Promise.resolve({ id: userB.id }),
      })
    );
    expect(detailB.data!.unread).toEqual({
      deposits: 0,
      withdrawals: 1,
      verification: 0,
    });
  });
});

describe("Badges — merely opening a page/section never changes the count", () => {
  it("opening the users list does not change the sidebar total or any row's count", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    await createPendingDeposit(user.id);
    loginAs(admin);

    await listUsers(new NextRequest("http://test/api/admin/users"));
    await listUsers(new NextRequest("http://test/api/admin/users"));

    expect(await getUnreadTotal()).toBe(1);
    const list = await readJson<{ users: UserRow[] }>(
      await listUsers(new NextRequest("http://test/api/admin/users"))
    );
    expect(list.data!.users.find((u) => u.id === user.id)!.unreadCount).toBe(1);
  });

  it("opening a user's own detail page does not change any count", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    await createPendingDeposit(user.id);
    await createPendingWithdrawal(user.id);
    loginAs(admin);

    for (let i = 0; i < 3; i++) {
      await userDetail(new NextRequest("http://test/x"), {
        params: Promise.resolve({ id: user.id }),
      });
    }

    expect(await getUnreadTotal()).toBe(2);
    const detail = await readJson<{ unread: UnreadCounts }>(
      await userDetail(new NextRequest("http://test/x"), {
        params: Promise.resolve({ id: user.id }),
      })
    );
    expect(detail.data!.unread).toEqual({ deposits: 1, withdrawals: 1, verification: 0 });
  });

  it("opening GET /api/admin/verification/[userId] does not clear the Verification badge", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await prisma.verificationDocument.create({
      data: { userId: user.id, type: "IDENTITY", fileName: "id.png" },
    });
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(1);

    await verificationDetail(new NextRequest("http://test/x"), {
      params: Promise.resolve({ userId: user.id }),
    });
    await verificationDetail(new NextRequest("http://test/x"), {
      params: Promise.resolve({ userId: user.id }),
    });

    expect(await getUnreadTotal()).toBe(1); // still there — only viewed, not decided
  });
});

describe("Badges — only Approve/Reject clears them", () => {
  it("Approving a deposit clears its badge", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    const deposit = await createPendingDeposit(user.id);
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(1);

    await decideTransaction(patchRequest("http://test/x", { decision: "APPROVE" }), {
      params: Promise.resolve({ id: deposit.id }),
    });

    expect(await getUnreadTotal()).toBe(0);
  });

  it("Rejecting a withdrawal clears its badge", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100 });
    const withdrawal = await createPendingWithdrawal(user.id, 50);
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(1);

    await decideTransaction(patchRequest("http://test/x", { decision: "REJECT" }), {
      params: Promise.resolve({ id: withdrawal.id }),
    });

    expect(await getUnreadTotal()).toBe(0);
  });

  it("Approving a verification clears its badge", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await prisma.verificationDocument.createMany({
      data: [
        { userId: user.id, type: "IDENTITY", fileName: "id.png" },
        { userId: user.id, type: "PROOF_OF_ADDRESS", fileName: "poa.png" },
      ],
    });
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(1);

    await decideVerification(patchRequest("http://test/x", { decision: "APPROVED" }), {
      params: Promise.resolve({ userId: user.id }),
    });

    expect(await getUnreadTotal()).toBe(0);
  });

  it("Rejecting a verification clears its badge", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await prisma.verificationDocument.createMany({
      data: [
        { userId: user.id, type: "IDENTITY", fileName: "id.png" },
        { userId: user.id, type: "PROOF_OF_ADDRESS", fileName: "poa.png" },
      ],
    });
    loginAs(admin);

    expect(await getUnreadTotal()).toBe(1);

    await decideVerification(
      patchRequest("http://test/x", { decision: "REJECTED", reason: "blurry" }),
      {
        params: Promise.resolve({ userId: user.id }),
      }
    );

    expect(await getUnreadTotal()).toBe(0);
  });
});

describe("Badges — resubmit after Reject creates the badge again", () => {
  it("REJECTED (badge 0) -> fresh PENDING documents (badge 1 again)", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await prisma.verificationDocument.createMany({
      data: [
        { userId: user.id, type: "IDENTITY", fileName: "id.png" },
        { userId: user.id, type: "PROOF_OF_ADDRESS", fileName: "poa.png" },
      ],
    });
    loginAs(admin);

    await decideVerification(
      patchRequest("http://test/x", { decision: "REJECTED", reason: "blurry" }),
      {
        params: Promise.resolve({ userId: user.id }),
      }
    );
    expect(await getUnreadTotal()).toBe(0);

    // Simulates POST /api/verification's resubmit (delete old rows, create
    // fresh PENDING ones) — see app/api/verification/route.ts.
    await prisma.verificationDocument.deleteMany({ where: { userId: user.id } });
    await prisma.verificationDocument.createMany({
      data: [
        { userId: user.id, type: "IDENTITY", fileName: "id2.png" },
        { userId: user.id, type: "PROOF_OF_ADDRESS", fileName: "poa2.png" },
      ],
    });

    expect(await getUnreadTotal()).toBe(1);
  });
});

describe("Badges — persistence across independent requests (no client-only state)", () => {
  it("a PENDING request keeps showing its badge across repeated GETs, unaffected by viewing", async () => {
    const admin = await seedAdmin();
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    await createPendingDeposit(user.id);
    loginAs(admin);

    // Each call here is its own request/response cycle reading straight
    // from the DB — simulates repeated page refreshes.
    expect(await getUnreadTotal()).toBe(1);
    await userDetail(new NextRequest("http://test/x"), {
      params: Promise.resolve({ id: user.id }),
    });
    expect(await getUnreadTotal()).toBe(1);
    expect(await getUnreadTotal()).toBe(1);
  });
});

describe("Badges — admin only", () => {
  it("a plain USER gets 403 from the unread-count endpoint", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);
    const res = await unreadCount();
    expect(res.status).toBe(403);
  });

  it("401s with no session at all", async () => {
    loggedOut();
    const res = await unreadCount();
    expect(res.status).toBe(401);
  });
});
