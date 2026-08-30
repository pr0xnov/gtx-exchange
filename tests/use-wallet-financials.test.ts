/**
 * Unit tests for lib/account/derive.ts's deriveWalletFinancials — the
 * pure arithmetic behind Available Balance / In Orders / Assets Value /
 * Profit-Loss, the single source of truth hooks/use-api.ts's
 * useWalletFinancials() feeds real query data into for both /wallet and
 * /trading. No DB, no network, no React — same style as
 * tests/account-derive.test.ts.
 *
 * Covers:
 * - Available Balance is SpotWallet(USDT).balance alone — never
 *   includes locked funds, never crypto value.
 * - In Orders is SpotWallet(USDT).locked alone — USDT reserved by this
 *   user's own OPEN LIMIT BUY orders (see app/api/spot/orders/route.ts:
 *   a LIMIT BUY moves notional from `balance` into `locked`; a LIMIT
 *   SELL reserves the base crypto currency instead, never USDT, so it
 *   is deliberately not reflected here).
 * - Assets Value is the sum of spotCurrencies[].value (current market
 *   price × quantity per non-USDT currency) — USDT excluded, cost basis
 *   never used.
 * - Profit/Loss passes account-summary's own `profit` straight through.
 */
import { describe, expect, it } from "vitest";
import { deriveWalletFinancials } from "@/lib/account/derive";

describe("Test A — no orders, USDT only", () => {
  it("Available Balance = full USDT, In Orders = 0", () => {
    const f = deriveWalletFinancials({
      usdtBalance: 5000,
      usdtLocked: 0,
      spotCurrencies: [],
      profit: 0,
    });
    expect(f.availableBalance).toBe(5000);
    expect(f.lockedInOrders).toBe(0);
    expect(f.assetsValue).toBe(0);
  });
});

describe("Test B — create LIMIT BUY reserves notional out of Available into In Orders", () => {
  it("Available decreases by the order's notional, In Orders increases by the same amount", () => {
    // SpotWallet(USDT) after POST /api/spot/orders places a 1,000 USDT
    // LIMIT BUY: balance -1,000, locked +1,000 (the route's own atomic
    // balance.decrement/locked.increment).
    const f = deriveWalletFinancials({
      usdtBalance: 4000,
      usdtLocked: 1000,
      spotCurrencies: [],
      profit: 0,
    });
    expect(f.availableBalance).toBe(4000);
    expect(f.lockedInOrders).toBe(1000);
  });
});

describe("Test C — cancel restores In Orders back to Available", () => {
  it("Available is restored, In Orders returns to 0", () => {
    // After POST .../cancel: locked -1,000, balance +1,000.
    const f = deriveWalletFinancials({
      usdtBalance: 5000,
      usdtLocked: 0,
      spotCurrencies: [],
      profit: 0,
    });
    expect(f.availableBalance).toBe(5000);
    expect(f.lockedInOrders).toBe(0);
  });
});

describe("Test D — fill consumes the reservation and credits the asset, no double debit", () => {
  it("In Orders returns to 0 and Assets Value reflects the purchased crypto, Available unchanged by the fill itself", () => {
    // fillSpotLimitOrder: locked -1,000 (USDT), balance +quantity (ETH).
    // Available was already debited at order-creation time, not here.
    const f = deriveWalletFinancials({
      usdtBalance: 4000,
      usdtLocked: 0,
      spotCurrencies: [
        {
          currency: "ETH",
          amount: 0.4,
          currentPrice: 2500,
          value: 1000,
          costBasis: 1000,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
      ],
      profit: 0,
    });
    expect(f.availableBalance).toBe(4000);
    expect(f.lockedInOrders).toBe(0);
    expect(f.assetsValue).toBe(1000);
  });
});

describe("Scenario D — Assets Value uses current price, not cost basis", () => {
  it("reflects the current market value even when it differs from the purchase price", () => {
    const f = deriveWalletFinancials({
      usdtBalance: 0,
      usdtLocked: 0,
      spotCurrencies: [
        {
          currency: "ETH",
          amount: 1,
          currentPrice: 2500,
          value: 2500, // current price, not the 2,000 purchase price
          costBasis: 2000,
          unrealizedPnl: 500,
          realizedPnl: 0,
        },
      ],
      profit: 0,
    });
    expect(f.assetsValue).toBe(2500);
  });
});

describe("Multiple assets sum into one Assets Value figure, USDT excluded", () => {
  it("adds every held currency's current value", () => {
    const f = deriveWalletFinancials({
      usdtBalance: 1000,
      usdtLocked: 0,
      spotCurrencies: [
        {
          currency: "ETH",
          amount: 0.6,
          currentPrice: 2500,
          value: 1500,
          costBasis: 1500,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
        {
          currency: "XRP",
          amount: 533.33,
          currentPrice: 1.5,
          value: 800,
          costBasis: 800,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
        {
          currency: "BNB",
          amount: 0.2857,
          currentPrice: 700,
          value: 200,
          costBasis: 200,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
      ],
      profit: 0,
    });
    expect(f.availableBalance).toBe(1000);
    expect(f.assetsValue).toBe(2500);
  });
});

describe("Available Balance never includes locked USDT, regardless of how large it is", () => {
  it("matches the exact demo@gtx.com regression case from the withdrawal-balance bug", () => {
    const f = deriveWalletFinancials({
      usdtBalance: 328.6,
      usdtLocked: 4252.7,
      spotCurrencies: [],
      profit: 0,
    });
    expect(f.availableBalance).toBe(328.6);
    expect(f.lockedInOrders).toBe(4252.7);
  });
});

describe("Test E/F — creating/cancelling an order must not move Profit/Loss", () => {
  it("Profit/Loss stays whatever the realized PnL already is, unaffected by the locked/available split", () => {
    const beforeOrder = deriveWalletFinancials({
      usdtBalance: 5000,
      usdtLocked: 0,
      spotCurrencies: [],
      profit: 0,
    });
    const afterOrder = deriveWalletFinancials({
      usdtBalance: 4000,
      usdtLocked: 1000,
      spotCurrencies: [],
      profit: 0,
    });
    const afterCancel = deriveWalletFinancials({
      usdtBalance: 5000,
      usdtLocked: 0,
      spotCurrencies: [],
      profit: 0,
    });
    expect(beforeOrder.profitLoss).toBe(0);
    expect(afterOrder.profitLoss).toBe(0); // NOT -1000
    expect(afterCancel.profitLoss).toBe(0); // NOT +1000
  });
});

describe("Wallet row not held at all yet (brand-new user, no SpotWallet row)", () => {
  it("treats a missing USDT wallet as 0 available and 0 locked, not a crash", () => {
    const f = deriveWalletFinancials({
      usdtBalance: undefined,
      usdtLocked: undefined,
      spotCurrencies: [],
      profit: 0,
    });
    expect(f.availableBalance).toBe(0);
    expect(f.lockedInOrders).toBe(0);
  });
});
