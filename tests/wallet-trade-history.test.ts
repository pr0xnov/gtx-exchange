// @vitest-environment jsdom
/**
 * Component tests for Wallet's "History" tab
 * (components/wallet/wallet-trade-history.tsx) — completed spot trades
 * only, sourced from the same useSpotOrders() hook Trading's own Order
 * history tab uses (see components/trading/spot-orders-panel.tsx), never
 * a second/mock data source. Covers: OPEN/CANCELLED orders are excluded
 * (only FILLED counts as a completed trade), Total = executed price ×
 * executed quantity, Buy/Sell color coding, the coin icon (shared
 * CoinIcon component), the empty state, and the bounded-height internal
 * scroll box (mirrors Trading's Open Orders/History scroll fix).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletTradeHistory } from "@/components/wallet/wallet-trade-history";
import type { SpotOrderDto } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

let ordersData: SpotOrderDto[] = [];
let isLoading = false;

vi.mock("@/hooks/use-api", () => ({
  useSpotOrders: () => ({ data: ordersData, isLoading }),
}));

function makeOrder(overrides: Partial<SpotOrderDto>): SpotOrderDto {
  return {
    id: "order-1",
    symbol: "BTCUSDT",
    side: "BUY",
    type: "MARKET",
    price: "60000",
    quantity: "0.05",
    filledQuantity: "0.05",
    status: "FILLED",
    createdAt: "2026-08-18T14:32:00Z",
    updatedAt: "2026-08-18T14:32:00Z",
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  isLoading = false;
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
        React.createElement(WalletTradeHistory)
      )
    );
  });
}

describe("WalletTradeHistory — only completed trades", () => {
  it("shows a FILLED order", () => {
    ordersData = [makeOrder({ status: "FILLED" })];
    render();
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
    expect(container.textContent).toContain("BTC/USDT");
  });

  it("excludes an OPEN order — it isn't a completed trade yet", () => {
    ordersData = [makeOrder({ id: "o1", status: "OPEN", filledQuantity: "0" })];
    render();
    expect(container.textContent).toContain("No trading history.");
    expect(container.querySelectorAll("tbody tr").length).toBe(1); // just the empty-state row
  });

  it("excludes a CANCELLED order — it never became a trade", () => {
    ordersData = [makeOrder({ id: "o1", status: "CANCELLED", filledQuantity: "0" })];
    render();
    expect(container.textContent).toContain("No trading history.");
  });

  it("mixed OPEN/CANCELLED/FILLED: only the FILLED one appears", () => {
    ordersData = [
      makeOrder({ id: "open", status: "OPEN", filledQuantity: "0" }),
      makeOrder({ id: "cancelled", status: "CANCELLED", filledQuantity: "0" }),
      makeOrder({ id: "filled", status: "FILLED" }),
    ];
    render();
    expect(container.querySelectorAll("tbody tr").length).toBe(1);
    expect(container.textContent).toContain("Filled");
  });
});

describe("WalletTradeHistory — Total = executed price × executed quantity", () => {
  it("computes Total from filledQuantity and price, not the original quantity", () => {
    ordersData = [
      makeOrder({ price: "60000", quantity: "0.05", filledQuantity: "0.05" }),
    ];
    render();
    // 0.05 * 60000 = 3000.00
    expect(container.textContent).toContain("3,000 USDT");
  });

  it("XRP/USDT limit sell example from the spec renders the right Total", () => {
    ordersData = [
      makeOrder({
        symbol: "XRPUSDT",
        side: "SELL",
        type: "LIMIT",
        price: "1.02",
        quantity: "100",
        filledQuantity: "100",
      }),
    ];
    render();
    expect(container.textContent).toContain("XRP/USDT");
    expect(container.textContent).toContain("Limit");
    expect(container.textContent).toContain("Sell");
    expect(container.textContent).toContain("1.02");
    expect(container.textContent).toContain("100 XRP");
    expect(container.textContent).toContain("102 USDT");
  });
});

describe("WalletTradeHistory — Buy/Sell color coding", () => {
  it("Buy renders with the success (green) badge variant", () => {
    ordersData = [makeOrder({ side: "BUY" })];
    render();
    const badge = Array.from(container.querySelectorAll("span")).find(
      (s) => s.textContent === "Buy"
    )!;
    expect(badge.className).toContain("text-primary");
  });

  it("Sell renders with the danger (red) badge variant", () => {
    ordersData = [makeOrder({ side: "SELL" })];
    render();
    const badge = Array.from(container.querySelectorAll("span")).find(
      (s) => s.textContent === "Sell"
    )!;
    expect(badge.className).toContain("text-danger");
  });
});

describe("WalletTradeHistory — shared coin icon system", () => {
  it("renders a real CoinIcon (svg) next to the pair, the same component Trading/My Assets use", () => {
    ordersData = [makeOrder({ symbol: "ETHUSDT" })];
    render();
    const firstCell = container.querySelector("tbody tr td:first-child")!;
    expect(firstCell.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("ETH/USDT");
    expect(container.textContent).toContain("Ethereum");
  });
});

describe("WalletTradeHistory — empty state and loading", () => {
  it("shows 'No trading history.' when there are no trades at all", () => {
    ordersData = [];
    render();
    expect(container.textContent).toContain("No trading history.");
  });

  it("shows a loading state while the query is in flight", () => {
    isLoading = true;
    ordersData = [];
    render();
    expect(container.textContent).toContain("Loading history…");
  });
});

describe("WalletTradeHistory — no internal vertical scroll box", () => {
  // The table grows with its row count and the /wallet page itself
  // scrolls — same as My Assets (assets-table.tsx) and Open Orders
  // (wallet-open-orders.tsx) right next to it. A max-height/overflow-y
  // here would spawn a second, nested scrollbar inside the card.
  it("the table's wrapper has no max-height, no fixed height, and no vertical overflow", () => {
    ordersData = Array.from({ length: 50 }, (_, i) =>
      makeOrder({
        id: `order-${i}`,
        createdAt: `2026-08-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
      })
    );
    render();
    const wrapper = container.querySelector("table")!.parentElement as HTMLElement;
    expect(wrapper.className).not.toMatch(/max-h-/);
    expect(wrapper.className).not.toMatch(/\bh-\d+\b/);
    expect(wrapper.className).not.toContain("overflow-y-auto");
    expect(wrapper.className).not.toContain("overflow-auto");
    expect(wrapper.className).not.toContain("overscroll-contain");
  });

  it("renders every trade — no pagination/truncation, however many there are", () => {
    ordersData = Array.from({ length: 50 }, (_, i) => makeOrder({ id: `order-${i}` }));
    render();
    expect(container.querySelectorAll("tbody tr").length).toBe(50);
  });

  it.each([1, 5, 20])(
    "renders every row for a list of %i trades with no height cap",
    (count) => {
      ordersData = Array.from({ length: count }, (_, i) =>
        makeOrder({ id: `order-${i}` })
      );
      render();
      expect(container.querySelectorAll("tbody tr").length).toBe(count);
      const wrapper = container.querySelector("table")!.parentElement as HTMLElement;
      expect(wrapper.className).not.toMatch(/max-h-/);
    }
  );
});
