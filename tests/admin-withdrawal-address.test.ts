/**
 * Withdrawal destination wallet address: must be persisted with the
 * Transaction and visible to Admin (per-user Withdrawals tab), exactly
 * the way network already is. Exercises the real routes
 * (app/api/withdraw, app/api/admin/users/[id]) against the test DB, same
 * pattern as tests/admin-deposit-network.test.ts.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as withdraw } from "@/app/api/withdraw/route";
import { GET as userDetail } from "@/app/api/admin/users/[id]/route";
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

async function seedAdmin() {
  const admin = await seedUserWithWallet(0);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
  return admin;
}

interface AdminTransactionRow {
  id: string;
  type: string;
  network: string | null;
  destinationAddress: string | null;
  amount: string;
  status: string;
}

async function getUserWithdrawals(userId: string): Promise<AdminTransactionRow[]> {
  const res = await userDetail(new NextRequest("http://test/x"), {
    params: Promise.resolve({ id: userId }),
  });
  const json = (await res.json()) as { data: { transactions: AdminTransactionRow[] } };
  return json.data.transactions.filter((t) => t.type === "WITHDRAWAL");
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

describe("Test B — withdrawal persists the destination address and Admin can see it", () => {
  it("Network=TRX, valid address, Amount=500 -> PENDING Withdrawal with the address, visible to Admin", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", {
        amount: 500,
        method: "TETHER_USDT",
        network: "TRX",
        destinationAddress: "TXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      })
    );
    expect(res.status).toBe(201);
    const created = (await res.json()).data;
    expect(created.status).toBe("PENDING");

    const admin = await seedAdmin();
    loginAs(admin);
    const withdrawals = await getUserWithdrawals(user.id);
    expect(withdrawals).toHaveLength(1);
    expect(withdrawals[0]!.network).toBe("TRX");
    expect(withdrawals[0]!.destinationAddress).toBe("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
  });
});

describe("Test C — a withdrawal without a destination address is rejected before debit", () => {
  it("empty destinationAddress -> 422, balance untouched, no Transaction created", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", {
        amount: 500,
        method: "TETHER_USDT",
        network: "TRX",
        destinationAddress: "",
      })
    );
    expect(res.status).toBe(422);

    const wallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: user.id, currency: "USDT" } },
    });
    expect(Number(wallet!.balance)).toBe(1000);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("a whitespace-only destinationAddress is also rejected", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", {
        amount: 500,
        method: "TETHER_USDT",
        network: "TRX",
        destinationAddress: "   ",
      })
    );
    expect(res.status).toBe(422);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });

  it("a missing destinationAddress field entirely is also rejected", async () => {
    const user = await seedVerifiedUser(1000);
    loginAs(user);

    const res = await withdraw(
      jsonRequest("http://test/api/withdraw", {
        amount: 500,
        method: "TETHER_USDT",
        network: "TRX",
      })
    );
    expect(res.status).toBe(422);
  });
});
