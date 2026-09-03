// @vitest-environment jsdom
/**
 * Component test for the Wallet top card (components/wallet/wallet-summary.tsx):
 * Available Balance / In Orders / Assets Value are unchanged. The 4th
 * card is now the SAME trailing-7-day weekly P/L /account shows (not the
 * old all-time Profit/Loss), with its own loading/error state. The old
 * aggregate "Unrealized PnL" line under the grid is gone entirely — see
 * tests/wallet-assets-table.test.ts for per-asset Unrealized PnL, which
 * is untouched.
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
          weeklyPnl: 50,
          weeklyPnlPercent: 2.5,
          weeklyPnlLoading: false,
          weeklyPnlError: false,
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

describe("WalletSummary — Available Balance / In Orders / Assets Value (unchanged)", () => {
  it("shows the three figures as distinct labelled cards", () => {
    render({ availableBalance: 1000, lockedInOrders: 300, assetsValue: 200 });
    expect(container.textContent).toContain("Available Balance");
    expect(container.textContent).toContain("In Orders");
    expect(container.textContent).toContain("Assets Value");
    expect(container.textContent).toContain("1,000 USDT");
    expect(container.textContent).toContain("300 USDT");
    expect(container.textContent).toContain("200 USDT");
  });

  it("In Orders reads 0 when nothing is reserved", () => {
    render({ availableBalance: 5000, lockedInOrders: 0 });
    const card = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent === "In Orders"
    )?.parentElement;
    expect(card?.textContent).toContain("0 USDT");
  });

  it("Available Balance and Assets Value are never collapsed into one number when assets are zero", () => {
    render({ availableBalance: 7439.01, assetsValue: 0 });
    expect(container.textContent).toContain("7,439.01 USDT");
    const assetsCard = Array.from(container.querySelectorAll("div")).find(
      (el) => el.textContent === "Assets Value"
    )?.parentElement;
    expect(assetsCard?.textContent).toContain("0 USDT");
    expect(assetsCard?.textContent).not.toContain("7,439.01");
  });
});

describe("WalletSummary — weekly (7-day) Profit/Loss, same figure as /account", () => {
  it("shows the 'за 7 дней/днів' label, not the old all-time Profit/Loss label", () => {
    render({ weeklyPnl: 42, weeklyPnlPercent: 2.41 });
    expect(container.textContent).toContain("(7 days)"); // en dictionary value
    expect(container.textContent).not.toBe("Profit / Loss");
  });

  it("shows the real weekly value and percentage", () => {
    render({ weeklyPnl: 123.45, weeklyPnlPercent: -1.09 });
    expect(container.textContent).toContain("123.45 USDT");
    expect(container.textContent).toContain("-1.09%");
  });

  it("colors it green when positive", () => {
    render({ weeklyPnl: 250, weeklyPnlPercent: 3 });
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("250 USDT")
    );
    expect(valueEl?.className).toContain("text-primary");
  });

  it("colors it red when negative", () => {
    render({ weeklyPnl: -30, weeklyPnlPercent: -0.5 });
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("-30 USDT")
    );
    expect(valueEl?.className).toContain("text-danger");
  });

  it("uses neutral styling for exactly 0", () => {
    render({ weeklyPnl: 0, weeklyPnlPercent: 0 });
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("0 USDT")
    );
    expect(valueEl?.className).not.toContain("text-primary");
    expect(valueEl?.className).not.toContain("text-danger");
  });

  it("omits the percentage line when it's null", () => {
    render({ weeklyPnl: 10, weeklyPnlPercent: null });
    expect(container.textContent).not.toContain("%");
  });

  it("shows its own loading skeleton, independent of the other three cards' isLoading", () => {
    render({ isLoading: false, weeklyPnlLoading: true });
    // Available Balance etc. render normally...
    expect(container.textContent).toContain("Available Balance");
    // ...but the weekly card shows a skeleton, not a stale/fake value.
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(1);
  });

  it("shows a neutral fallback, not a crash, when the weekly endpoint errors", () => {
    render({ weeklyPnlError: true });
    expect(() => container.textContent).not.toThrow();
    expect(container.textContent).toContain("—");
  });

  it("this panel's own background never tints red/green (unlike /account)", () => {
    render({ weeklyPnl: -500, weeklyPnlPercent: -10 });
    const panel = container.querySelector(".rounded-2xl.border.border-border.bg-card");
    expect(panel).not.toBeNull();
    expect(panel!.className).not.toContain("bg-danger");
    expect(panel!.className).not.toContain("bg-primary");
  });
});

describe("WalletSummary — old aggregate Unrealized PnL line is gone", () => {
  it("no 'Unrealized PnL' text anywhere on this component", () => {
    render();
    expect(container.textContent).not.toContain("Unrealized PnL");
  });
});

describe("WalletSummary — decorative sparkline chart is gone", () => {
  it("leaves no empty reserved space where the chart used to sit", () => {
    render();
    expect(container.querySelector(".sm\\:w-56")).toBeNull();
  });
});
