/**
 * Admin visibility of a Deposit's chosen network and payment-
 * confirmation proof: the per-user detail endpoint
 * (GET /api/admin/users/[id]) must return the `network` code and proof
 * metadata (`proofFileName`/`proofMimeType`) a USDT deposit was created
 * with, unmodified — the admin page derives the human network label +
 * deposit address from lib/deposit/usdt-networks.ts and opens the proof
 * via the separate protected GET /api/deposit/[id]/proof, so the raw
 * `proofData` bytes must NEVER appear in this (or any other) list
 * response.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { POST as deposit } from "@/app/api/deposit/route";
import { GET as userDetail } from "@/app/api/admin/users/[id]/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { User } from "@prisma/client";
import { USDT_NETWORKS, type UsdtNetwork } from "@/lib/deposit/usdt-networks";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
}

async function seedAdmin() {
  const admin = await seedUserWithWallet(0);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } });
  return admin;
}

function depositRequest(fields: {
  amount: number;
  method: string;
  network: string;
  proof?: File;
}): NextRequest {
  const form = new FormData();
  form.set("amount", String(fields.amount));
  form.set("method", fields.method);
  form.set("network", fields.network);
  form.set(
    "proof",
    fields.proof ??
      new File([new Uint8Array([1, 2, 3])], "proof.png", { type: "image/png" })
  );
  return new NextRequest("http://test/api/deposit", { method: "POST", body: form });
}

interface AdminTransactionRow {
  id: string;
  type: string;
  network: string | null;
  amount: string;
  proofFileName?: string | null;
  proofMimeType?: string | null;
  proofData?: unknown;
}

async function getUserDeposits(userId: string): Promise<AdminTransactionRow[]> {
  const res = await userDetail(new NextRequest("http://test/x"), {
    params: Promise.resolve({ id: userId }),
  });
  const json = (await res.json()) as { data: { transactions: AdminTransactionRow[] } };
  return json.data.transactions.filter((t) => t.type === "DEPOSIT");
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

describe.each(["BSC", "TRX", "ETH"] as UsdtNetwork[])(
  "Admin sees the exact network a deposit was created with — %s",
  (network) => {
    it(`stores and returns network=${network} unchanged`, async () => {
      const user = await seedUserWithWallet(0);
      loginAs(user);

      const res = await deposit(
        depositRequest({ amount: 100, method: "TETHER_USDT", network })
      );
      expect(res.status).toBe(201);

      const admin = await seedAdmin();
      loginAs(admin);
      const deposits = await getUserDeposits(user.id);
      expect(deposits).toHaveLength(1);
      expect(deposits[0]!.network).toBe(network);

      // The address itself is never stored — Admin derives it from the
      // network code via the same static config the Deposit page uses.
      expect(USDT_NETWORKS[network].address).toBeTruthy();
    });
  }
);

describe("Rejects an unsupported network at the API boundary", () => {
  it("returns a validation error for network='SOL'", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const res = await deposit(
      depositRequest({ amount: 100, method: "TETHER_USDT", network: "SOL" })
    );
    expect(res.status).toBe(422);
  });
});

describe("Admin sees proof metadata but never the raw bytes", () => {
  it("returns proofFileName/proofMimeType, and proofData is never present in the JSON response", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const proof = new File([new Uint8Array([9, 9, 9, 9])], "my-transfer.png", {
      type: "image/png",
    });
    const res = await deposit(
      depositRequest({ amount: 250, method: "TETHER_USDT", network: "TRX", proof })
    );
    expect(res.status).toBe(201);

    const admin = await seedAdmin();
    loginAs(admin);
    const deposits = await getUserDeposits(user.id);
    expect(deposits).toHaveLength(1);
    expect(deposits[0]!.proofFileName).toBe("my-transfer.png");
    expect(deposits[0]!.proofMimeType).toBe("image/png");
    expect(deposits[0]).not.toHaveProperty("proofData");
  });
});

describe("A deposit without a screenshot is rejected before creation", () => {
  it("no file field at all -> 422, no Transaction created", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const form = new FormData();
    form.set("amount", "500");
    form.set("method", "TETHER_USDT");
    form.set("network", "BSC");
    const res = await deposit(
      new NextRequest("http://test/api/deposit", { method: "POST", body: form })
    );
    expect(res.status).toBe(422);

    const count = await prisma.transaction.count({ where: { userId: user.id } });
    expect(count).toBe(0);
  });
});
