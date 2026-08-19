// @vitest-environment jsdom
/**
 * Component tests for the Wallet "My Assets" table
 * (components/wallet/assets-table.tsx): clickable rows navigating to
 * Trading's existing ?symbol= param, the Chart column (real sparkline
 * data only, never MiniSparkline's fake fallback), and that Price/Cost
 * basis render as genuinely distinguishable values for low-priced coins.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletAssetsTable } from "@/components/wallet/assets-table";
import type { SpotAssetSummaryDto } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const BTC_ROW: SpotAssetSummaryDto = {
  currency: "BTC",
  symbol: "BTCUSDT",
  amount: 0.027464,
  currentPrice: 1748.25 / 0.027464,
  value: 1748.25,
  costBasis: 1739.48,
  unrealizedPnl: 8.77,
  realizedPnl: 0,
};

// A low-priced coin where 2-decimal rounding would make Price and Cost
// basis look identical even though they're genuinely different.
const DOGE_ROW: SpotAssetSummaryDto = {
  currency: "DOGE",
  symbol: "DOGEUSDT",
  amount: 200,
  currentPrice: 0.07022,
  value: 14.044, // price = 0.07022
  costBasis: 14.054, // cost/unit = 0.07027
  unrealizedPnl: -0.01,
  realizedPnl: 0,
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  push.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(rows: SpotAssetSummaryDto[], sparklines: Record<string, number[]> = {}) {
  act(() => {
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(WalletAssetsTable, { rows, sparklines, isLoading: false })
      )
    );
  });
}

describe("WalletAssetsTable — clickable rows navigate to Trading", () => {
  it("clicking the BTC row navigates to /trading?symbol=BTCUSDT (Trading's own existing param)", () => {
    render([BTC_ROW]);
    const row = container.querySelector('tr[aria-label="BTC: Open on Trading"]')!;
    act(() => {
      row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(push).toHaveBeenCalledWith("/trading?symbol=BTCUSDT");
  });

  it("pressing Enter on a focused row also navigates", () => {
    render([BTC_ROW]);
    const row = container.querySelector(
      'tr[aria-label="BTC: Open on Trading"]'
    )! as HTMLElement;
    act(() => {
      row.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(push).toHaveBeenCalledWith("/trading?symbol=BTCUSDT");
  });

  it("rows are focusable and marked as links for accessibility", () => {
    render([BTC_ROW]);
    const row = container.querySelector('tr[aria-label="BTC: Open on Trading"]')!;
    expect(row.getAttribute("role")).toBe("link");
    expect(row.getAttribute("tabindex")).toBe("0");
  });
});

describe("WalletAssetsTable — Price vs Cost basis are genuinely distinguishable", () => {
  it("shows different values (with enough precision) for a low-priced coin like DOGE", () => {
    render([DOGE_ROW]);
    const text = container.textContent!;
    // price ~0.0702, cost ~0.0703 — must not both render as "0.07"
    expect(text).toContain("0.0702");
    expect(text).toContain("0.0703");
  });
});

describe("WalletAssetsTable — Chart column", () => {
  it("renders a real sparkline when at least 2 real price points are supplied", () => {
    render([BTC_ROW], { BTCUSDT: [62000, 62500, 63000, 63500] });
    expect(container.querySelector('[data-testid="chart-cell"] svg')).not.toBeNull();
  });

  it("shows a loading skeleton (not a fake chart, not a static dead-end) while sparkline data hasn't arrived yet", () => {
    render([BTC_ROW], {});
    const cell = container.querySelector('[data-testid="chart-cell"]')!;
    expect(cell.querySelector("svg")).toBeNull();
    expect(cell.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(cell.querySelector('[aria-hidden="true"]')!.className).toContain(
      "animate-pulse"
    );
  });
});

describe("WalletAssetsTable — empty/loading states", () => {
  it("shows an empty-state message with no fake assets when there are none", () => {
    render([]);
    expect(container.textContent).toContain("don't have any assets yet");
  });
});
