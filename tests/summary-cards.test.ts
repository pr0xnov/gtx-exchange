// @vitest-environment jsdom
/**
 * Component test for Account's top card
 * (components/dashboard/summary-cards.tsx): Available Balance / In
 * Orders / Assets Value are still the exact same shared
 * useWalletFinancials() figures /wallet and /trading show (mocked here,
 * unchanged). The 4th card — Profit/Loss — is Account-specific now: a
 * trailing-7-day, price-driven figure from its own useWeeklyAssetPnl()
 * hook (see app/api/account/weekly-pnl/route.ts), deliberately NOT
 * useWalletFinancials().profitLoss (that's the all-time figure Wallet/
 * Trading still show, untouched by this change).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import type { WalletFinancials, WeeklyPnlDto } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { translate } from "@/lib/i18n/dictionaries";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

let financials: WalletFinancials;
let weeklyPnl: { data: WeeklyPnlDto | undefined; isLoading: boolean };

vi.mock("@/hooks/use-api", () => ({
  useWalletFinancials: () => financials,
  useWeeklyAssetPnl: () => weeklyPnl,
}));

function t(key: Parameters<typeof translate>[1]) {
  return translate("en", key);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  financials = {
    availableBalance: 0,
    lockedInOrders: 0,
    assetsValue: 0,
    profitLoss: 0, // still part of the shared type; simply unused by this component now
    isLoading: false,
  };
  weeklyPnl = { data: { pnl: 0, percent: 0 }, isLoading: false };
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

describe("SummaryCards — Available Balance / In Orders / Assets Value (unchanged, shared with Wallet/Trading)", () => {
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

  it("renders the three shared values exactly as given", () => {
    financials = {
      availableBalance: 4087,
      lockedInOrders: 897.14,
      assetsValue: 2441.65,
      profitLoss: -125, // irrelevant to this component now
      isLoading: false,
    };
    render();

    expect(cardText("Available Balance")).toContain("4,087 USDT");
    expect(cardText("In Orders")).toContain("897.14 USDT");
    expect(cardText("Assets Value")).toContain("2,441.65 USDT");
  });

  it("no orders: In Orders reads 0", () => {
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

  it("no assets: Assets Value reads 0, In Orders still shows the reservation", () => {
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
});

describe("SummaryCards — weekly (7-day) Profit/Loss card", () => {
  it("shows the '(7 days)' label, not the shared all-time Profit/Loss label", () => {
    weeklyPnl = { data: { pnl: 42, percent: 2.41 }, isLoading: false };
    render();
    expect(container.textContent).toContain(t("account.summary.weeklyProfitLoss"));
  });

  it("shows the real weekly pnl value and, when available, its percentage", () => {
    weeklyPnl = { data: { pnl: 123.45, percent: 2.41 }, isLoading: false };
    render();
    expect(container.textContent).toContain("+123.45 USDT");
    expect(container.textContent).toContain("+2.41%");
  });

  it("colors it green when positive", () => {
    weeklyPnl = { data: { pnl: 250, percent: 4.1 }, isLoading: false };
    render();
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("250 USDT")
    );
    expect(valueEl?.className).toContain("text-primary");
  });

  it("colors it red when negative", () => {
    weeklyPnl = { data: { pnl: -150, percent: -3.2 }, isLoading: false };
    render();
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("-150 USDT")
    );
    expect(valueEl?.className).toContain("text-danger");
  });

  it("uses neutral styling, not green or red, for exactly 0", () => {
    weeklyPnl = { data: { pnl: 0, percent: 0 }, isLoading: false };
    render();
    const valueEl = Array.from(container.querySelectorAll("div.font-bold")).find((el) =>
      el.textContent?.includes("0 USDT")
    );
    expect(valueEl?.className).not.toContain("text-primary");
    expect(valueEl?.className).not.toContain("text-danger");
  });

  it("no current crypto holdings -> 0 USDT and 0.00%, not an omitted/blank percentage", () => {
    weeklyPnl = { data: { pnl: 0, percent: 0 }, isLoading: false };
    render();
    expect(container.textContent).toContain("0 USDT");
    expect(container.textContent).toContain("0.00%");
  });

  it("shows a loading skeleton, not a stale/zero value, while the weekly figure is still loading", () => {
    weeklyPnl = { data: undefined, isLoading: true };
    render();
    // Available Balance/In Orders/Assets Value aren't loading in this
    // scenario, so exactly one skeleton (the weekly card's own) exists.
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(1);
    expect(container.textContent).toContain(t("account.summary.weeklyProfitLoss"));
  });
});
