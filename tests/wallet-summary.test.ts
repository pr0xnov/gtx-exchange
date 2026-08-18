// @vitest-environment jsdom
/**
 * Component test for the Wallet top card (components/wallet/wallet-summary.tsx):
 * Transfer is gone, "Est. Total Value" wording is gone in favor of explicit
 * Balance/Equity/Profit (matching Account), and Unrealized PnL is shown as
 * a distinct figure.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletSummary } from "@/components/wallet/wallet-summary";

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
      React.createElement(WalletSummary, {
        balance: 1000,
        equity: 1200,
        profit: 50,
        unrealizedPnl: 20,
        unrealizedPnlPercent: 2,
        isLoading: false,
        ...overrides,
      })
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

describe("WalletSummary — Balance/Equity/Profit replace 'Est. Total Value'", () => {
  it("no longer shows the old 'Est. Total Value' wording", () => {
    render();
    expect(container.textContent).not.toContain("Est. Total Value");
  });

  it("shows Balance, Equity, and Profit as distinct labelled figures", () => {
    render();
    expect(container.textContent).toContain("Balance");
    expect(container.textContent).toContain("Equity");
    expect(container.textContent).toContain("Profit");
    expect(container.textContent).toContain("$1,000.00"); // balance
    expect(container.textContent).toContain("$1,200.00"); // equity
  });

  it("shows Unrealized PnL as a separate figure from Profit", () => {
    render({ profit: 50, unrealizedPnl: 20 });
    expect(container.textContent).toContain("Unrealized PnL");
    expect(container.textContent).toContain("$20.00");
    // Profit (+$50.00) and Unrealized PnL (+$20.00) must both be visible
    // and distinct — never collapsed into one number.
    expect(container.textContent).toContain("$50.00");
  });

  it("colors Profit red when negative, independent of Equity/Balance", () => {
    render({ balance: 1000, equity: 1200, profit: -30 });
    const profitSpan = Array.from(container.querySelectorAll("span")).find((s) =>
      s.textContent?.includes("-$30.00")
    );
    expect(profitSpan).toBeTruthy();
    expect(profitSpan!.parentElement!.className).toContain("text-danger");
  });
});
