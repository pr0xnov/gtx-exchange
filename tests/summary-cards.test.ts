// @vitest-environment jsdom
/**
 * Component test for Account's top card
 * (components/dashboard/summary-cards.tsx): the old Balance/Equity/
 * Profit trio is gone in favor of the exact same four figures /wallet
 * and /trading show — Available Balance / In Orders / Assets Value /
 * Profit-Loss — sourced from the same shared useWalletFinancials() hook
 * (mocked here), so all three pages can never disagree.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import type { WalletFinancials } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

let financials: WalletFinancials;

vi.mock("@/hooks/use-api", () => ({
  useWalletFinancials: () => financials,
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
        React.createElement(SummaryCards)
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

describe("SummaryCards — Account shows the same four figures as Wallet/Trading", () => {
  it("no longer shows the old Balance/Equity/Profit labels", () => {
    financials = {
      availableBalance: 4087,
      lockedInOrders: 897.14,
      assetsValue: 2441.65,
      profitLoss: -125,
      isLoading: false,
    };
    render();
    expect(container.textContent).not.toContain("Equity");
  });

  it("Scenario from spec section 7: renders exactly the given four values", () => {
    financials = {
      availableBalance: 4087,
      lockedInOrders: 897.14,
      assetsValue: 2441.65,
      profitLoss: -125,
      isLoading: false,
    };
    render();

    expect(cardText("Available Balance")).toContain("4,087 USDT");
    expect(cardText("In Orders")).toContain("897.14 USDT");
    expect(cardText("Assets Value")).toContain("2,441.65 USDT");
    expect(container.textContent).toContain("-125 USDT");
  });

  it("Test 18 — no orders: In Orders reads 0", () => {
    financials = {
      availableBalance: 5000,
      lockedInOrders: 0,
      assetsValue: 1000,
      profitLoss: 0,
      isLoading: false,
    };
    render();
    expect(cardText("Available Balance")).toContain("5,000 USDT");
    expect(cardText("In Orders")).toContain("0 USDT");
    expect(cardText("Assets Value")).toContain("1,000 USDT");
  });

  it("Test 19 — no assets: Assets Value reads 0, In Orders still shows the reservation", () => {
    financials = {
      availableBalance: 5000,
      lockedInOrders: 1000,
      assetsValue: 0,
      profitLoss: 0,
      isLoading: false,
    };
    render();
    expect(cardText("Available Balance")).toContain("5,000 USDT");
    expect(cardText("In Orders")).toContain("1,000 USDT");
    expect(cardText("Assets Value")).toContain("0 USDT");
  });

  it("colors Profit/Loss green when positive", () => {
    financials = {
      availableBalance: 0,
      lockedInOrders: 0,
      assetsValue: 0,
      profitLoss: 250,
      isLoading: false,
    };
    render();
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("250 USDT")
    );
    expect(valueEl?.className).toContain("text-primary");
  });

  it("colors Profit/Loss red when negative", () => {
    financials = {
      availableBalance: 0,
      lockedInOrders: 0,
      assetsValue: 0,
      profitLoss: -150,
      isLoading: false,
    };
    render();
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("-150 USDT")
    );
    expect(valueEl?.className).toContain("text-danger");
  });
});
