import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { baseAssetOf } from "@/lib/markets/derive";
import { computeSpotCostBasis } from "@/lib/spot/cost-basis";
import { calculateAccountSummary, type SpotCurrencySummary } from "@/lib/account/derive";

const QUOTE_CURRENCY = "USDT";

/**
 * The single source of Balance/Equity/Profit for Account, Wallet, and
 * Trading's header — see lib/account/derive.ts for why this exists (it
 * used to be three separate client-side calculations that could
 * disagree). Everything here is computed server-side from one query
 * pass and one price snapshot (`Asset.lastPrice`, the same DB-persisted
 * price source /api/portfolio and /api/positions already use), so all
 * three pages read the same numbers instead of each merging live
 * ticker/poll data independently at slightly different instants.
 *
 * Spot-only, deliberately — Balance is the Spot USDT wallet's balance
 * alone. The margin/futures `Wallet.balance` is NOT included: Spot
 * orders can only ever debit/credit `SpotWallet` (see
 * app/api/spot/orders/route.ts), so a margin-inclusive Balance here
 * would show money the Spot engine can't actually spend — exactly the
 * "Account Balance says $X but Trading's Available says $Y" bug this
 * caused. Credit, usedMargin, freeMargin, and any Futures PnL are never
 * read at all. (The margin Wallet still exists and is still what
 * Deposit/Withdraw move — Spot's own USDT pool is currently only funded
 * at registration/seed time, a pre-existing gap in this app's two-ledger
 * design, not something this endpoint can paper over.)
 */
export async function GET() {
  try {
    const user = await requireUser();

    const [spotWallets, spotOrders] = await Promise.all([
      prisma.spotWallet.findMany({ where: { userId: user.id } }),
      prisma.spotOrder.findMany({
        where: { userId: user.id, filledQuantity: { gt: 0 } },
        orderBy: { updatedAt: "asc" },
      }),
    ]);

    const spotUsdtWallet = spotWallets.find((w) => w.currency === QUOTE_CURRENCY);
    const spotUsdtBalance =
      Number(spotUsdtWallet?.balance ?? 0) + Number(spotUsdtWallet?.locked ?? 0);

    // Every currency ever held OR traded, even one now fully sold to 0 —
    // its realized PnL still counts toward Profit even though it won't
    // appear in the display list below.
    const currencies = new Set<string>();
    for (const w of spotWallets) {
      if (w.currency !== QUOTE_CURRENCY) currencies.add(w.currency);
    }
    for (const o of spotOrders) {
      currencies.add(baseAssetOf(o.symbol));
    }

    const symbols = [...currencies].map((c) => `${c}${QUOTE_CURRENCY}`);
    const assets =
      symbols.length > 0
        ? await prisma.asset.findMany({ where: { symbol: { in: symbols } } })
        : [];
    const priceBySymbol = new Map(assets.map((a) => [a.symbol, Number(a.lastPrice)]));

    const spotCurrencies: (SpotCurrencySummary & { symbol: string })[] = [
      ...currencies,
    ].map((currency) => {
      const symbol = `${currency}${QUOTE_CURRENCY}`;
      const currentPrice = priceBySymbol.get(symbol) ?? 0;
      const wallet = spotWallets.find((w) => w.currency === currency);
      const currentQuantity = Number(wallet?.balance ?? 0) + Number(wallet?.locked ?? 0);

      const fills = spotOrders
        .filter((o) => baseAssetOf(o.symbol) === currency)
        .map((o) => ({
          side: o.side,
          price: Number(o.price),
          filledQuantity: Number(o.filledQuantity),
        }));

      const { costBasis, unrealizedPnl, realizedPnl } = computeSpotCostBasis(
        fills,
        currentQuantity,
        currentPrice
      );

      return {
        currency,
        symbol,
        amount: currentQuantity,
        currentPrice,
        value: currentQuantity * currentPrice,
        costBasis,
        unrealizedPnl,
        realizedPnl,
      };
    });

    // Balance/Equity/Profit are computed from the FULL, unfiltered
    // spotCurrencies list — a fully-sold currency's value is already
    // exactly 0 (amount × price), so it can't inflate Equity either way,
    // but its realizedPnl must still count toward Profit (money actually
    // banked from a real completed sell doesn't stop being real just
    // because the position is now closed).
    const { balance, equity, profit } = calculateAccountSummary({
      cashBalance: spotUsdtBalance,
      spotCurrencies,
    });

    // "My Assets" only lists currencies the user currently holds —
    // amount = 0 means fully sold out, and per spec that asset
    // disappears from the display list entirely (it's not deleted from
    // SpotWallet or from the supported-currency registry; a later BUY
    // recreates a normal, visible row with a fresh cost basis, since
    // SpotWallet rows are never actually removed — see
    // lib/spot/wallet.ts's ensureSpotWallet).
    const spotAssets = spotCurrencies.filter((c) => c.amount > 0);

    return apiSuccess({
      balance,
      equity,
      profit,
      spotAssets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
