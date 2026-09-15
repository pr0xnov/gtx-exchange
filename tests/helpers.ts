import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateReferralCode } from "@/lib/referral/code";
import type { User, Wallet } from "@prisma/client";

/** Deletes all rows in FK-dependency order. Called between tests for full isolation. */
export async function resetDatabase() {
  await prisma.$transaction([
    prisma.trade.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.position.deleteMany(),
    prisma.order.deleteMany(),
    prisma.spotOrder.deleteMany(),
    prisma.spotWallet.deleteMany(),
    prisma.verificationDocument.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.userSettings.deleteMany(),
    // SupportMessage references SupportConversation (RESTRICT-equivalent
    // ordering for clarity, even though both cascade from User) — must go
    // before its parent conversation.
    prisma.supportMessage.deleteMany(),
    prisma.supportConversation.deleteMany(),
    // Both reference Transaction/User with a RESTRICT (not CASCADE) delete
    // rule on adminId/transactionId — must go before those two.
    prisma.balanceAdjustment.deleteMany(),
    prisma.auditLog.deleteMany(),
    // Both reference User with a RESTRICT delete rule — must go before
    // user.deleteMany() below.
    prisma.referralReward.deleteMany(),
    prisma.firstDepositBonus.deleteMany(),
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
      referralCode: generateReferralCode(),
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

export async function seedSpotWallet(params: {
  userId: string;
  currency: string;
  balance?: number;
  locked?: number;
}) {
  return prisma.spotWallet.create({
    data: {
      userId: params.userId,
      currency: params.currency,
      balance: params.balance ?? 0,
      locked: params.locked ?? 0,
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
