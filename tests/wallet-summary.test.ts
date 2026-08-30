// @vitest-environment jsdom
/**
 * Component test for the Wallet top card (components/wallet/wallet-summary.tsx):
 * Transfer is gone, and the four cards are explicitly Available Balance /
 * In Orders / Assets Value / Profit-Loss (not the old Balance/Equity/Profit
 * trio) — see hooks/use-api.ts's useWalletFinancials for why these are
 * distinct figures, not a relabel of account-summary's raw balance/equity
 * pair. Unrealized PnL is shown as a separate figure from Profit/Loss.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletSummary } from "@/components/wallet/wallet-summary";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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

function render(overrides: Partial<React.ComponentProps<typeof WalletSummary>> = {}) {
  act(() => {
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(WalletSummary, {
          availableBalance: 1000,
          lockedInOrders: 0,
          assetsValue: 200,
          profitLoss: 50,
          unrealizedPnl: 20,
          unrealizedPnlPercent: 2,
          isLoading: false,
          ...overrides,
        })
      )
    );
  });
}

describe("WalletSummary — action buttons", () => {
  it("no longer shows a Transfer button", () => {
    render();
    expect(container.textContent).not.toContain("Transfer");
  });

  it("still shows Deposit, Withdraw, and History", () => {
    render();
    expect(container.querySelector('a[href="/deposit"]')).not.toBeNull();
    expect(container.querySelector('a[href="/withdrawal"]')).not.toBeNull();
    expect(container.querySelector('a[href="/history"]')).not.toBeNull();
  });
});

describe("WalletSummary — Available Balance / Assets Value / Profit-Loss", () => {
  it("no longer shows the old 'Est. Total Value' wording", () => {
    render();
    expect(container.textContent).not.toContain("Est. Total Value");
  });

  it("shows Available Balance, In Orders, Assets Value, and Profit / Loss as distinct labelled figures", () => {
    render({ availableBalance: 1000, lockedInOrders: 300, assetsValue: 200 });
    expect(container.textContent).toContain("Available Balance");
    expect(container.textContent).toContain("In Orders");
    expect(container.textContent).toContain("Assets Value");
    expect(container.textContent).toContain("Profit / Loss");
    expect(container.textContent).toContain("1,000 USDT"); // available balance
    expect(container.textContent).toContain("300 USDT"); // in orders
    expect(container.textContent).toContain("200 USDT"); // assets value
  });

  it("In Orders reads 0 when nothing is reserved", () => {
    render({ availableBalance: 5000, lockedInOrders: 0 });
    const card = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent === "In Orders"
    )?.parentElement;
    expect(card?.textContent).toContain("0 USDT");
  });

  it("In Orders reflects the reserved amount when an order is open", () => {
    render({ availableBalance: 4000, lockedInOrders: 1000 });
    const card = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent === "In Orders"
    )?.parentElement;
    expect(card?.textContent).toContain("1,000 USDT");
  });

  it("Available Balance and Assets Value are never collapsed into one number when assets are zero", () => {
    // The exact bug this card split fixes: previously "Balance" and
    // "Equity" (now Available Balance / Assets Value) showed the same
    // number whenever the user held zero crypto, because Equity was
    // Balance + 0 crypto value.
    render({ availableBalance: 7439.01, assetsValue: 0 });
    expect(container.textContent).toContain("7,439.01 USDT");
    expect(container.textContent).toContain("Assets Value");
    // The Assets Value card itself must read exactly 0, not 7,439.01.
    const assetsCard = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent === "Assets Value"
    )?.parentElement;
    expect(assetsCard?.textContent).toContain("0 USDT");
    expect(assetsCard?.textContent).not.toContain("7,439.01");
  });

  it("shows Unrealized PnL as a separate figure from Profit / Loss", () => {
    render({ profitLoss: 50, unrealizedPnl: 20 });
    expect(container.textContent).toContain("Unrealized PnL");
    expect(container.textContent).toContain("20 USDT");
    // Profit/Loss (+50 USDT) and Unrealized PnL (+20 USDT) must both be
    // visible and distinct — never collapsed into one number.
    expect(container.textContent).toContain("50 USDT");
  });

  it("colors Profit/Loss red when negative, independent of Available Balance/Assets Value", () => {
    render({ availableBalance: 1000, assetsValue: 200, profitLoss: -30 });
    const profitSpan = Array.from(container.querySelectorAll("span")).find((s) =>
      s.textContent?.includes("-30 USDT")
    );
    expect(profitSpan).toBeTruthy();
    expect(profitSpan!.parentElement!.className).toContain("text-danger");
  });
});
