// @vitest-environment jsdom
/**
 * Component tests for Wallet's "My Assets" / "Open Orders" tab card
 * (components/wallet/wallet-assets-section.tsx +
 * components/wallet/wallet-open-orders.tsx): My Assets is the default
 * tab, switching tabs is pure client state (no navigation), Open Orders
 * reuses Trading's own useSpotOrders/useCancelSpotOrder (mocked here,
 * exactly as tests/trading-terminal.test.ts already mocks them), and
 * cancelling removes the order and triggers the same balance-refresh
 * invalidations Trading's own panel relies on.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WalletAssetsSection } from "@/components/wallet/wallet-assets-section";
import type { SpotOrderDto } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const mutateAsync = vi.fn().mockResolvedValue({});
let ordersData: SpotOrderDto[] = [];

vi.mock("@/hooks/use-api", () => ({
  useSpotOrders: () => ({ data: ordersData, isLoading: false }),
  useCancelSpotOrder: () => ({ mutateAsync, isPending: false }),
}));

const OPEN_LIMIT_ORDER: SpotOrderDto = {
  id: "order-1",
  symbol: "BTCUSDT",
  side: "BUY",
  type: "LIMIT",
  price: "60000",
  quantity: "0.05005691",
  filledQuantity: "0",
  status: "OPEN",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const FILLED_MARKET_TRADE: SpotOrderDto = {
  id: "order-2",
  symbol: "BTCUSDT",
  side: "BUY",
  type: "MARKET",
  price: "60000",
  quantity: "0.05",
  filledQuantity: "0.05",
  status: "FILLED",
  createdAt: "2026-08-18T14:32:00Z",
  updatedAt: "2026-08-18T14:32:00Z",
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  push.mockReset();
  mutateAsync.mockClear();
  ordersData = [];
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
        React.createElement(WalletAssetsSection, {
          rows: [],
          sparklines: {},
          isLoading: false,
        })
      )
    );
  });
}

describe("WalletAssetsSection — tabs", () => {
  it("shows My Assets content by default (empty state), not Open Orders", () => {
    render();
    expect(container.textContent).toContain("don't have any assets yet");
    expect(container.textContent).not.toContain("No open orders.");
  });

  it("clicking the Open Orders tab switches content without navigating", () => {
    render();
    const ordersTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Open Orders"
    )!;
    act(() => {
      ordersTab.click();
    });
    expect(container.textContent).toContain("No open orders.");
    expect(push).not.toHaveBeenCalled();
  });

  it("switching back to My Assets restores the assets table", () => {
    render();
    const ordersTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Open Orders"
    )!;
    act(() => ordersTab.click());
    const assetsTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "My Assets"
    )!;
    act(() => assetsTab.click());
    expect(container.textContent).toContain("don't have any assets yet");
  });
});

describe("WalletAssetsSection — Open Orders reuses Trading's own order data", () => {
  it("renders a real open limit order with the expected columns", () => {
    ordersData = [OPEN_LIMIT_ORDER];
    render();
    const ordersTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Open Orders"
    )!;
    act(() => ordersTab.click());

    const text = container.textContent!;
    expect(text).toContain("BTC/USDT");
    expect(text).toContain("Limit");
    expect(text).toContain("Buy");
    expect(text).toContain("60,000.00");
    expect(text).toContain("0.05005691");
    expect(text).toContain("Open");
  });

  it("clicking the cancel button calls the shared cancel mutation with the order id", () => {
    ordersData = [OPEN_LIMIT_ORDER];
    render();
    const ordersTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Open Orders"
    )!;
    act(() => ordersTab.click());

    const cancelButton = container.querySelector('button[aria-label="Cancel order"]')!;
    act(() => {
      cancelButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(mutateAsync).toHaveBeenCalledWith("order-1");
  });
});

describe("WalletAssetsSection — History tab", () => {
  it("a third tab, History, exists alongside My Assets and Open Orders", () => {
    render();
    const labels = Array.from(container.querySelectorAll("button")).map(
      (b) => b.textContent
    );
    expect(labels).toEqual(
      expect.arrayContaining(["My Assets", "Open Orders", "History"])
    );
  });

  it("clicking History shows completed trades from the same useSpotOrders source, not My Assets/Open Orders", () => {
    ordersData = [OPEN_LIMIT_ORDER, FILLED_MARKET_TRADE];
    render();
    const historyTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "History"
    )!;
    act(() => historyTab.click());

    const text = container.textContent!;
    expect(text).toContain("BTC/USDT");
    expect(text).toContain("Market");
    expect(text).toContain("Buy");
    expect(text).toContain("Filled");
    // The still-OPEN limit order must not leak into History.
    expect(text).not.toContain("No open orders.");
  });

  it("switching History -> My Assets -> History does not break layout or lose data", () => {
    ordersData = [FILLED_MARKET_TRADE];
    render();
    const historyTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "History"
    )!;
    const assetsTab = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "My Assets"
    )!;
    act(() => historyTab.click());
    act(() => assetsTab.click());
    act(() => historyTab.click());
    expect(container.textContent).toContain("BTC/USDT");
    expect(container.textContent).toContain("Filled");
  });
});
