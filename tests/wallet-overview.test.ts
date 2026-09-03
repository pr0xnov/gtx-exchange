// @vitest-environment jsdom
/**
 * Component tests for components/wallet/wallet-overview.tsx — the wiring
 * between useWalletFinancials()/useAccountSummary()/useWeeklyAssetPnl()
 * and WalletSummary's cards. The real arithmetic behind Available
 * Balance / In Orders / Assets Value lives in useWalletFinancials()
 * itself (see tests/use-wallet-financials.test.ts); the weekly P/L
 * figure's own math lives in lib/spot/weekly-pnl.ts (see
 * tests/weekly-pnl.test.ts) — this file only proves WalletOverview wires
 * the SAME useWeeklyAssetPnl() hook /account uses straight through,
 * unmodified, and that the old aggregate Unrealized-PnL line is gone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletOverview } from "@/components/wallet/wallet-overview";
import type { AccountSummaryDto, WalletFinancials, WeeklyPnlDto } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

let accountSummary: AccountSummaryDto | undefined;
let financials: WalletFinancials;
let weeklyPnl: { data: WeeklyPnlDto | undefined; isLoading: boolean; isError: boolean };

vi.mock("@/hooks/use-api", () => ({
  useAccountSummary: () => ({ data: accountSummary, isLoading: false }),
  useWalletFinancials: () => financials,
  useWeeklyAssetPnl: () => weeklyPnl,
  useSparklines: () => ({}),
  useSpotOrders: () => ({ data: [], isLoading: false }),
  useCancelSpotOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  weeklyPnl = { data: { pnl: 0, percent: 0 }, isLoading: false, isError: false };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render() {
  act(() => {
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(WalletOverview)
      )
    );
  });
}

function cardText(label: string): string {
  const el = Array.from(container.querySelectorAll("div")).find(
    (d) => d.textContent === label
  );
  return el?.parentElement?.textContent ?? "";
}

describe("WalletOverview — passes useWalletFinancials() straight through to Available Balance/In Orders/Assets Value", () => {
  it("Scenario A: only USDT, zero crypto — Available Balance shows the full amount, everything else 0", () => {
    accountSummary = { balance: 7439.01, equity: 7439.01, profit: 0, spotAssets: [] };
    financials = {
      availableBalance: 7439.01,
      lockedInOrders: 0,
      assetsValue: 0,
      profitLoss: 0,
      isLoading: false,
    };
    render();

    expect(cardText("Available Balance")).toContain("7,439.01 USDT");
    expect(cardText("In Orders")).toContain("0 USDT");
    expect(cardText("Assets Value")).toContain("0 USDT");
  });

  it("splits Available Balance / In Orders / Assets Value into three distinct, correctly-sourced numbers", () => {
    accountSummary = { balance: 0, equity: 0, profit: 0, spotAssets: [] };
    financials = {
      availableBalance: 4000,
      lockedInOrders: 1000,
      assetsValue: 1000,
      profitLoss: 125.4, // no longer rendered by this page at all
      isLoading: false,
    };
    render();

    expect(cardText("Available Balance")).toContain("4,000 USDT");
    expect(cardText("In Orders")).toContain("1,000 USDT");
    expect(cardText("Assets Value")).toContain("1,000 USDT");
  });
});

describe("WalletOverview — weekly P/L is the SAME useWeeklyAssetPnl() hook /account uses", () => {
  it("passes the hook's pnl/percent straight through, unmodified", () => {
    financials = {
      availableBalance: 0,
      lockedInOrders: 0,
      assetsValue: 2500,
      profitLoss: 999, // must NOT be what's shown for the weekly card
      isLoading: false,
    };
    weeklyPnl = {
      data: { pnl: -1727.6, percent: -1.09 },
      isLoading: false,
      isError: false,
    };
    render();

    expect(container.textContent).toContain("1,727.6");
    expect(container.textContent).toContain("-1.09%");
    expect(container.textContent).not.toContain("999 USDT");
  });

  it("the old aggregate 'Unrealized PnL' summary line is gone, even though the per-asset table below legitimately still has an 'Unrealized PnL' column", () => {
    accountSummary = {
      balance: 0,
      equity: 0,
      profit: 0,
      spotAssets: [
        {
          currency: "ETH",
          symbol: "ETHUSDT",
          amount: 1,
          currentPrice: 2500,
          value: 2500,
          costBasis: 2000,
          unrealizedPnl: 500,
          realizedPnl: 0,
        },
      ],
    };
    financials = {
      availableBalance: 0,
      lockedInOrders: 0,
      assetsValue: 2500,
      profitLoss: 0,
      isLoading: false,
    };
    render();

    // The per-asset table's own "Unrealized PnL" column header is
    // expected and untouched...
    expect(container.textContent).toContain("Unrealized PnL");
    // ...but the top summary panel specifically must not have its own
    // aggregate line anymore.
    const summaryPanel = container.querySelector(
      ".rounded-2xl.border.border-border.bg-card"
    );
    expect(summaryPanel).not.toBeNull();
    expect(summaryPanel!.textContent).not.toContain("Unrealized PnL");
  });
});
