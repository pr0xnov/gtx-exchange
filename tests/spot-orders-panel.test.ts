// @vitest-environment jsdom
/**
 * Component tests for Trading's Open Orders / Order History panel
 * (components/trading/spot-orders-panel.tsx).
 *
 * The panel has a fixed height (h-52) with its own internal vertical
 * scroll — independent of the chart above it, which must never resize
 * because of row count or which tab is active. Open orders and Order
 * history are each rendered into their own always-mounted scroll
 * container (toggled via the `hidden` class rather than conditional
 * rendering), so switching tabs can never reset or clamp the other
 * tab's scroll position, and never remounts a container mid-poll.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SpotOrdersPanel } from "@/components/trading/spot-orders-panel";
import type { SpotOrderDto } from "@/hooks/use-api";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "SOLUSDT",
  "DOGEUSDT",
  "LTCUSDT",
];

function makeOrders(
  count: number,
  status: SpotOrderDto["status"] = "OPEN"
): SpotOrderDto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `order-${status}-${i}`,
    symbol: SYMBOLS[i % SYMBOLS.length]!,
    side: i % 2 === 0 ? "BUY" : "SELL",
    type: "LIMIT",
    price: "100",
    quantity: "1",
    filledQuantity: "0",
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

let ordersData: SpotOrderDto[] = [];
const mutateAsync = vi.fn().mockResolvedValue({});

vi.mock("@/hooks/use-api", () => ({
  useSpotOrders: () => ({ data: ordersData, isLoading: false }),
  useCancelSpotOrder: () => ({ mutateAsync, isPending: false }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mutateAsync.mockClear();
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
        React.createElement(SpotOrdersPanel)
      )
    );
  });
}

function clickTab(label: "Open orders" | "Order history") {
  const button = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.startsWith(label)
  )!;
  act(() => button.click());
}

// The two per-tab scroll boxes are the panel root's 2nd and 3rd
// children (1st is the tab bar) — Open orders first, Order history second.
function scrollBoxes(): [HTMLElement, HTMLElement] {
  const panel = container.firstElementChild as HTMLElement;
  return [panel.children[1] as HTMLElement, panel.children[2] as HTMLElement];
}

describe("SpotOrdersPanel — fixed-height panel with its own internal scroll", () => {
  it("the panel has a fixed height, unaffected by row count", () => {
    ordersData = makeOrders(50);
    render();
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.className).toMatch(/\bh-52\b/);
  });

  it("each tab's scroll box can shrink to the fixed box and scroll internally", () => {
    ordersData = makeOrders(50);
    render();
    for (const box of scrollBoxes()) {
      expect(box.className).toContain("min-h-0");
      expect(box.className).toContain("overflow-y-auto");
      expect(box.className).toContain("overscroll-contain");
    }
  });

  it.each([0, 1, 3, 5, 10, 20, 50])(
    "renders every row for a list of %i open orders — nothing is truncated or paginated",
    (count) => {
      ordersData = makeOrders(count);
      render();
      const [openBox] = scrollBoxes();
      const rows = openBox.querySelectorAll("tbody tr");
      if (count === 0) {
        expect(rows.length).toBe(1); // "No open orders." placeholder row
        expect(openBox.textContent).toContain("No open orders.");
      } else {
        expect(rows.length).toBe(count);
      }
    }
  );

  it("keeps each tab's column header pinned to the top of its own scroll box", () => {
    ordersData = makeOrders(50);
    render();
    for (const box of scrollBoxes()) {
      const thead = box.querySelector("thead")!;
      expect(thead.className).toContain("sticky");
      expect(thead.className).toContain("top-0");
    }
  });
});

describe("SpotOrdersPanel — both tabs stay mounted, scroll never jumps between them", () => {
  it("both tabs' scroll boxes exist in the DOM at all times — the inactive one is just hidden", () => {
    ordersData = [...makeOrders(2, "OPEN"), ...makeOrders(20, "FILLED")];
    render();
    const [openBox, historyBox] = scrollBoxes();
    // Starts on "open": history box present but hidden.
    expect(openBox.className).not.toContain("hidden");
    expect(historyBox.className).toContain("hidden");

    clickTab("Order history");
    // Same DOM nodes — not remounted — just the hidden class flips.
    const [openBox2, historyBox2] = scrollBoxes();
    expect(openBox2).toBe(openBox);
    expect(historyBox2).toBe(historyBox);
    expect(openBox2.className).toContain("hidden");
    expect(historyBox2.className).not.toContain("hidden");
  });

  it("scrolling Open orders down and switching to Order history and back leaves Open orders' scroll position untouched", () => {
    ordersData = [...makeOrders(20, "OPEN"), ...makeOrders(2, "FILLED")];
    render();
    const [openBox] = scrollBoxes();

    // jsdom doesn't lay out real pixel heights, so scrollHeight is 0 —
    // set scrollTop directly to simulate "the user scrolled" and prove
    // nothing in the tab-switch path programmatically resets it.
    openBox.scrollTop = 123;
    expect(openBox.scrollTop).toBe(123);

    clickTab("Order history");
    clickTab("Open orders");

    const [openBoxAfter] = scrollBoxes();
    expect(openBoxAfter).toBe(openBox); // never remounted
    expect(openBoxAfter.scrollTop).toBe(123); // never reset
  });

  it("switching to Order history with fewer total rows than Open orders' scroll position does not clamp/disturb Open orders' own scrollTop", () => {
    // Open orders has plenty of rows; Order history has very few — this
    // is exactly the case that used to clamp scrollTop when both tabs
    // shared one scroll container.
    ordersData = [...makeOrders(30, "OPEN"), ...makeOrders(1, "FILLED")];
    render();
    const [openBox, historyBox] = scrollBoxes();
    openBox.scrollTop = 999;

    clickTab("Order history");
    expect(historyBox.scrollTop).toBe(0); // history's own, independent position
    expect(openBox.scrollTop).toBe(999); // untouched while hidden
  });
});

describe("SpotOrdersPanel — existing behavior stays intact", () => {
  it("still shows the coin icon next to each pair (PairCell)", () => {
    ordersData = makeOrders(3);
    render();
    const [openBox] = scrollBoxes();
    const pairCells = openBox.querySelectorAll("tbody tr td:first-child");
    expect(pairCells.length).toBe(3);
    pairCells.forEach((cell) => {
      expect(cell.querySelector("svg")).not.toBeNull();
    });
    expect(openBox.textContent).toContain("BTC/USD");
  });

  it("cancel button still calls useCancelSpotOrder with the order id", () => {
    ordersData = makeOrders(1);
    render();
    const cancelButton = container.querySelector('button[aria-label="Cancel order"]')!;
    act(() => {
      (cancelButton as HTMLButtonElement).click();
    });
    expect(mutateAsync).toHaveBeenCalledWith("order-OPEN-0");
  });

  it("Order history still filters out OPEN orders", () => {
    ordersData = [...makeOrders(2, "OPEN"), ...makeOrders(3, "FILLED")];
    render();
    clickTab("Order history");
    const [, historyBox] = scrollBoxes();
    expect(historyBox.querySelectorAll("tbody tr").length).toBe(3);
    expect(historyBox.textContent).not.toContain("No order history yet.");
  });

  it("the Open orders tab label shows the live count", () => {
    ordersData = makeOrders(4, "OPEN");
    render();
    const openTabButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.startsWith("Open orders")
    )!;
    expect(openTabButton.textContent).toContain("(4)");
  });
});
