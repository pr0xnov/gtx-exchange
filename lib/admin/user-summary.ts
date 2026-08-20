import { prisma } from "@/lib/db";
import { calculateAccountSummary } from "@/lib/account/derive";
import type { SpotWallet, VerificationDocument } from "@prisma/client";

const QUOTE_CURRENCY = "USDT";

export type VerificationStatus = "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED";

/** Same "both document types must be approved" bar Settings/Withdrawal
 *  already implies (see lib/verification-gating in tests) — reused here
 *  rather than a second, looser admin-only definition of "verified". */
export function deriveVerificationStatus(
  docs: VerificationDocument[]
): VerificationStatus {
  if (docs.length === 0) return "UNVERIFIED";
  if (docs.some((d) => d.status === "REJECTED")) return "REJECTED";
  const types = new Set(docs.map((d) => d.type));
  const approvedTypes = new Set(
    docs.filter((d) => d.status === "APPROVED").map((d) => d.type)
  );
  if (
    types.has("IDENTITY") &&
    types.has("PROOF_OF_ADDRESS") &&
    approvedTypes.size === 2
  ) {
    return "VERIFIED";
  }
  return "PENDING";
}

export interface UserFinancialSummary {
  balance: number;
  equity: number;
}

/**
 * Balance/Equity for a batch of users in a small, fixed number of queries
 * (not one round-trip per user) — same formula as
 * lib/account/derive.ts's calculateAccountSummary (Balance = Spot USDT
 * wallet; Equity = Balance + current value of every Spot holding), reused
 * rather than reimplemented so the Admin Users list can never disagree
 * with what a user's own Account/Wallet page shows them.
 */
export async function batchUserFinancialSummaries(
  userIds: string[]
): Promise<Map<string, UserFinancialSummary>> {
  if (userIds.length === 0) return new Map();

  const wallets = await prisma.spotWallet.findMany({
    where: { userId: { in: userIds } },
  });
  const walletsByUser = new Map<string, SpotWallet[]>();
  for (const w of wallets) {
    const list = walletsByUser.get(w.userId) ?? [];
    list.push(w);
    walletsByUser.set(w.userId, list);
  }

  const currencies = new Set<string>();
  for (const w of wallets) {
    if (w.currency !== QUOTE_CURRENCY) currencies.add(w.currency);
  }
  const symbols = [...currencies].map((c) => `${c}${QUOTE_CURRENCY}`);
  const assets =
    symbols.length > 0
      ? await prisma.asset.findMany({ where: { symbol: { in: symbols } } })
      : [];
  const priceByCurrency = new Map(assets.map((a) => [a.baseAsset, Number(a.lastPrice)]));

  const result = new Map<string, UserFinancialSummary>();
  for (const userId of userIds) {
    const userWallets = walletsByUser.get(userId) ?? [];
    const usdt = userWallets.find((w) => w.currency === QUOTE_CURRENCY);
    const cashBalance = Number(usdt?.balance ?? 0) + Number(usdt?.locked ?? 0);

    const spotCurrencies = userWallets
      .filter((w) => w.currency !== QUOTE_CURRENCY)
      .map((w) => {
        const amount = Number(w.balance) + Number(w.locked);
        const currentPrice = priceByCurrency.get(w.currency) ?? 0;
        return {
          currency: w.currency,
          amount,
          value: amount * currentPrice,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
        };
      });

    const { balance, equity } = calculateAccountSummary({ cashBalance, spotCurrencies });
    result.set(userId, { balance, equity });
  }

  return result;
}
