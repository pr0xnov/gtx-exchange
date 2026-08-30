// @vitest-environment jsdom
/**
 * Component tests for components/wallet/wallet-overview.tsx — the
 * wiring between useWalletFinancials()/useAccountSummary() and
 * WalletSummary's four cards. The real arithmetic behind Available
 * Balance / In Orders / Assets Value now lives in useWalletFinancials()
 * itself (hooks/use-api.ts, see tests/use-wallet-financials.test.ts for
 * that) — this file only proves WalletOverview passes the hook's output
 * through to the UI unmodified, and still derives its own
 * Wallet-specific Unrealized PnL from useAccountSummary()'s spotAssets.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletOverview } from "@/components/wallet/wallet-overview";
import type { AccountSummaryDto, WalletFinancials } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

let accountSummary: AccountSummaryDto | undefined;
let financials: WalletFinancials;

vi.mock("@/hooks/use-api", () => ({
  useAccountSummary: () => ({ data: accountSummary, isLoading: false }),
  useWalletFinancials: () => financials,
  useSparklines: () => ({}),
  useSpotOrders: () => ({ data: [], isLoading: false }),
  useCancelSpotOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
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

describe("WalletOverview — passes useWalletFinancials() straight through to the four cards", () => {
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
    accountSummary = {
      balance: 0,
      equity: 0,
      profit: 0,
      spotAssets: [
        {
          currency: "ETH",
          symbol: "ETHUSDT",
          amount: 0.4,
          currentPrice: 2500,
          value: 1000,
          costBasis: 800,
          unrealizedPnl: 200,
          realizedPnl: 0,
        },
      ],
    };
    financials = {
      availableBalance: 4000,
      lockedInOrders: 1000,
      assetsValue: 1000,
      profitLoss: 125.4,
      isLoading: false,
    };
    render();

    expect(cardText("Available Balance")).toContain("4,000 USDT");
    expect(cardText("In Orders")).toContain("1,000 USDT");
    expect(cardText("Assets Value")).toContain("1,000 USDT");
    expect(container.textContent).toContain("125.4 USDT");
  });

  it("still derives Unrealized PnL locally from useAccountSummary()'s spotAssets, distinct from Profit/Loss", () => {
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

    expect(container.textContent).toContain("Unrealized PnL");
    expect(container.textContent).toContain("500 USDT");
  });
});
