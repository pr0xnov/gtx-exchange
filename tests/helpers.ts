import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { User, Wallet } from "@prisma/client";

/** Deletes all rows in FK-dependency order. Called between tests for full isolation. */
export async function resetDatabase() {
  await prisma.$transaction([
    prisma.trade.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.position.deleteMany(),
    prisma.order.deleteMany(),
    prisma.verificationDocument.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.userSettings.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.user.deleteMany(),
    prisma.asset.deleteMany(),
  ]);
}

export type UserWithWallet = User & { wallet: Wallet };

/**
 * Creates a real User + Wallet row and re-fetches it in exactly the shape
 * `requireUser()` returns (`User & { wallet: Wallet | null }`), so it can
 * be handed straight to `vi.mocked(requireUser).mockResolvedValue(...)`
 * without hand-faking Prisma's Decimal fields.
 */
export async function seedUserWithWallet(balance: number): Promise<UserWithWallet> {
  const id = randomUUID();
  const user = await prisma.user.create({
    data: {
      firstName: "Test",
      lastName: "User",
      email: `user-${id}@test.gtx`,
      passwordHash: "not-used-in-tests",
      wallet: { create: { balance, currency: "USDT" } },
    },
    include: { wallet: true },
  });
  return user as UserWithWallet;
}

export async function seedAsset(
  lastPrice: number,
  symbol = `TST${randomUUID().slice(0, 8)}`
) {
  return prisma.asset.create({
    data: {
      symbol,
      baseAsset: symbol.replace("USDT", ""),
      quoteAsset: "USDT",
      lastPrice,
    },
  });
}

export async function seedOpenPosition(params: {
  userId: string;
  assetId: string;
  side: "LONG" | "SHORT";
  amount: number;
  leverage: number;
  entryPrice: number;
  currentPrice: number;
  margin: number;
}) {
  return prisma.position.create({
    data: {
      userId: params.userId,
      assetId: params.assetId,
      side: params.side,
      amount: params.amount,
      leverage: params.leverage,
      entryPrice: params.entryPrice,
      currentPrice: params.currentPrice,
      margin: params.margin,
      status: "OPEN",
    },
  });
}

export async function seedPendingLimitOrder(params: {
  userId: string;
  assetId: string;
  side: "BUY" | "SELL";
  amount: number;
  leverage: number;
  limitPrice: number;
}) {
  return prisma.order.create({
    data: {
      userId: params.userId,
      assetId: params.assetId,
      type: "LIMIT",
      side: params.side,
      amount: params.amount,
      leverage: params.leverage,
      limitPrice: params.limitPrice,
      status: "PENDING",
    },
  });
}

export function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
