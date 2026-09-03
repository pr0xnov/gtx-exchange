import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { baseAssetOf } from "@/lib/markets/derive";
import { fetchKlines } from "@/lib/binance/client";
import { computeWeeklyPnl, type TimedSpotFill } from "@/lib/spot/weekly-pnl";

const QUOTE_CURRENCY = "USDT";
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Account's "Прибыль / Убыток за 7 дней" — a SEPARATE, infrequently-
 * polled endpoint from /api/account/summary (which is polled every 5s
 * by Wallet/Trading too — see hooks/use-api.ts's useAccountSummary).
 * Splitting this out keeps that shared, frequently-polled endpoint free
 * of the external historical-price lookups this one needs, so Wallet
 * and Trading's own "Прибыль / Убыток" card (all-time realized PnL,
 * unchanged) is completely unaffected by this feature.
 *
 * Historical prices reuse the exact same Binance klines proxy Trading's
 * chart and /api/markets/klines already use (lib/binance/client.ts) —
 * no new provider. A symbol whose historical fetch fails (delisted,
 * renamed, or — only in tests — a synthetic symbol that was never a
 * real Binance pair) is skipped rather than failing the whole request;
 * see lib/spot/weekly-pnl.ts for why deposits/withdrawals/admin balance
 * adjustments can never appear here at all (this only ever reads
 * SpotWallet/SpotOrder, never Transaction or BalanceAdjustment).
 *
 * Only currencies with a CURRENT balance > 0 are ever priced — a sold/
 * closed position needs no Binance lookup or fill history at all, since
 * it's defined to contribute exactly 0 (see lib/spot/weekly-pnl.ts). The
 * full fill history for those held currencies (not just the window) is
 * then fetched in one query so computeWeeklyPnl can replay it to find
 * how much of the current quantity predates the window, rather than an
 * admin/seed credit masquerading as a real position.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const windowStart = new Date(Date.now() - WINDOW_MS);

    const spotWallets = await prisma.spotWallet.findMany({ where: { userId: user.id } });

    const heldCurrencies = spotWallets.filter(
      (w) => w.currency !== QUOTE_CURRENCY && Number(w.balance) + Number(w.locked) > 0
    );

    const allOrders = heldCurrencies.length
      ? await prisma.spotOrder.findMany({
          where: {
            userId: user.id,
            filledQuantity: { gt: 0 },
            symbol: { in: heldCurrencies.map((w) => `${w.currency}${QUOTE_CURRENCY}`) },
          },
          orderBy: { updatedAt: "asc" },
        })
      : [];

    let totalPnl = 0;
    let totalBaselineValue = 0;

    await Promise.all(
      heldCurrencies.map(async (wallet) => {
        const currency = wallet.currency;
        const currentQuantity = Number(wallet.balance) + Number(wallet.locked);
        const symbol = `${currency}${QUOTE_CURRENCY}`;

        let historicalPrice: number;
        let currentPrice: number;
        try {
          // One candle at (or just before) window-start, and one at now —
          // both from the same real historical series, so "current" and
          // "7 days ago" are directly comparable rather than mixing this
          // endpoint's own price with a separately-cached DB snapshot.
          const [historicalCandle, currentCandle] = await Promise.all([
            fetchKlines(symbol, "1h", 1, windowStart.getTime()),
            fetchKlines(symbol, "1h", 1),
          ]);
          if (historicalCandle.length === 0 || currentCandle.length === 0) return;
          historicalPrice = historicalCandle[0]!.close;
          currentPrice = currentCandle[currentCandle.length - 1]!.close;
        } catch {
          // Not a real/currently-listed Binance pair — skip rather than
          // fabricate or crash the whole response.
          return;
        }

        const fills: TimedSpotFill[] = allOrders
          .filter((o) => baseAssetOf(o.symbol) === currency)
          .map((o) => ({
            side: o.side,
            price: Number(o.price),
            filledQuantity: Number(o.filledQuantity),
            at: o.updatedAt,
          }));

        const { pnl, baselineValue } = computeWeeklyPnl(
          fills,
          currentQuantity,
          currentPrice,
          historicalPrice,
          windowStart
        );

        totalPnl += pnl;
        totalBaselineValue += baselineValue;
      })
    );

    // No current crypto holdings (or no valid baseline) -> 0%, never
    // null/NaN/Infinity — there's nothing to measure, not "unknown".
    const percent = totalBaselineValue > 0 ? (totalPnl / totalBaselineValue) * 100 : 0;

    return apiSuccess({ pnl: totalPnl, percent });
  } catch (error) {
    return handleApiError(error);
  }
}
