import { prisma } from "@/lib/db";
import { calculateAccountSummary } from "@/lib/account/derive";
import type { SpotWallet, DocumentStatus, DocumentType } from "@prisma/client";

const QUOTE_CURRENCY = "USDT";

export type VerificationStatus = "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED";

/** Same "both document types must be approved" bar Settings/Withdrawal
 *  already implies (see lib/verification-gating in tests) — reused here
 *  rather than a second, looser admin-only definition of "verified".
 *  Narrowed to only the two fields this actually reads (rather than the
 *  full VerificationDocument shape) so callers that select a subset of
 *  columns — e.g. the user-facing GET /api/verification, which never
 *  needs to pull fileData — can pass their result straight through. */
export function deriveVerificationStatus(
  docs: { status: DocumentStatus; type: DocumentType }[]
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

export interface UnreadRequestCounts {
  deposits: number;
  withdrawals: number;
  /** Verification is reviewed as a single unit (both documents decided
   *  together — see app/api/admin/verification/[userId]), never a count
   *  of individual documents, so this is always 0 or 1. */
  verification: 0 | 1;
}

/**
 * Deposit/Withdrawal/Verification requests still awaiting an admin
 * decision, for a batch of users — same "few fixed queries, not one per
 * user" shape as batchUserFinancialSummaries. Badge meaning: "this
 * request still requires Approve/Reject", so it's a pure `status ===
 * "PENDING"` count — merely opening the page/tab a request lives on does
 * NOT clear it; only an actual Approve/Reject decision (which flips
 * status away from PENDING) does. Deliberately does NOT consult
 * Transaction.adminViewedAt / VerificationDocument.adminViewedAt (an
 * earlier "seen" tracker for a since-abandoned unread-messages framing of
 * this badge) — those columns are left in the schema to avoid an
 * unneeded migration, but nothing reads or writes them anymore.
 */
export async function batchUnreadRequestCounts(
  userIds: string[]
): Promise<Map<string, UnreadRequestCounts>> {
  const result = new Map<string, UnreadRequestCounts>();
  if (userIds.length === 0) return result;

  for (const userId of userIds) {
    result.set(userId, { deposits: 0, withdrawals: 0, verification: 0 });
  }

  const [txCounts, verificationUsers] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["userId", "type"],
      where: {
        userId: { in: userIds },
        type: { in: ["DEPOSIT", "WITHDRAWAL"] },
        status: "PENDING",
      },
      _count: { _all: true },
    }),
    prisma.verificationDocument.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "PENDING" },
    }),
  ]);

  for (const row of txCounts) {
    const entry = result.get(row.userId);
    if (!entry) continue;
    if (row.type === "DEPOSIT") entry.deposits = row._count._all;
    else if (row.type === "WITHDRAWAL") entry.withdrawals = row._count._all;
  }
  for (const v of verificationUsers) {
    const entry = result.get(v.userId);
    if (entry) entry.verification = 1;
  }

  return result;
}

/** Same definition as batchUnreadRequestCounts, totalled across every
 *  user — powers the Admin sidebar's single "Users" badge. */
export async function totalUnreadRequestCount(): Promise<number> {
  const [txCount, verificationUsers] = await Promise.all([
    prisma.transaction.count({
      where: { type: { in: ["DEPOSIT", "WITHDRAWAL"] }, status: "PENDING" },
    }),
    prisma.verificationDocument.groupBy({
      by: ["userId"],
      where: { status: "PENDING" },
    }),
  ]);

  return txCount + verificationUsers.length;
}
