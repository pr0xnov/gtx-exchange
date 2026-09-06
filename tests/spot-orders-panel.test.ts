// @vitest-environment jsdom
/**
 * Component tests for Trading's Open Orders / Order History panel
 * (components/trading/spot-orders-panel.tsx).
 *
 * The panel renders at its NATURAL height now (no internal fixed-height
 * scrollbox) — it's a full-width row below Trading's top workspace (see
 * components/trading/trading-terminal.tsx), and the PAGE scrolls once it
 * plus everything above it exceeds one viewport. Open orders and Order
 * history are still each rendered into their own always-mounted
 * container (toggled via the `hidden` class rather than conditional
 * rendering), so switching tabs never remounts either one mid-poll.
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
  status: SpotOrderDto["status"] = "OPEN",
  filledQuantity = "0"
): SpotOrderDto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `order-${status}-${i}`,
    symbol: SYMBOLS[i % SYMBOLS.length]!,
    side: i % 2 === 0 ? "BUY" : "SELL",
    type: "LIMIT",
    price: "100",
    quantity: "1",
    filledQuantity,
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

// The two per-tab panels are the root's 2nd and 3rd children (1st is the
// tab bar) — Open orders first, Order history second.
function tabPanels(): [HTMLElement, HTMLElement] {
  const panel = container.firstElementChild as HTMLElement;
  return [panel.children[1] as HTMLElement, panel.children[2] as HTMLElement];
}

describe("SpotOrdersPanel — natural height, normal page scrolling (no internal scrollbox)", () => {
  it("the panel itself carries no fixed height", () => {
    ordersData = makeOrders(50);
    render();
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.className).not.toMatch(/\bh-52\b/);
    expect(panel.className).not.toContain("overflow-y-auto");
  });

  it("neither tab panel has its own internal scroll container anymore", () => {
    ordersData = makeOrders(50);
    render();
    for (const panel of tabPanels()) {
      expect(panel.className).not.toContain("overflow-y-auto");
      expect(panel.className).not.toContain("overscroll-contain");
    }
  });

  it.each([0, 1, 3, 5, 10, 20, 50])(
    "renders every row for a list of %i open orders — nothing is truncated or paginated",
    (count) => {
      ordersData = makeOrders(count);
      render();
      const [openPanel] = tabPanels();
      const rows = openPanel.querySelectorAll("tbody tr");
      if (count === 0) {
        expect(rows.length).toBe(1); // "No open orders." placeholder row
        expect(openPanel.textContent).toContain("No open orders.");
      } else {
        expect(rows.length).toBe(count);
      }
    }
  );

  it("keeps each tab's column header sticky (now relative to the page, since there's no inner scrollbox)", () => {
    ordersData = makeOrders(50);
    render();
    for (const panel of tabPanels()) {
      const thead = panel.querySelector("thead")!;
      expect(thead.className).toContain("sticky");
      expect(thead.className).toContain("top-0");
    }
  });
});

describe("SpotOrdersPanel — both tabs stay mounted", () => {
  it("both tabs' panels exist in the DOM at all times — the inactive one is just hidden, never remounted", () => {
    ordersData = [...makeOrders(2, "OPEN"), ...makeOrders(20, "FILLED")];
    render();
    const [openPanel, historyPanel] = tabPanels();
    // Starts on "open": history panel present but hidden.
    expect(openPanel.className).not.toContain("hidden");
    expect(historyPanel.className).toContain("hidden");

    clickTab("Order history");
    // Same DOM nodes — not remounted — just the hidden class flips.
    const [openPanel2, historyPanel2] = tabPanels();
    expect(openPanel2).toBe(openPanel);
    expect(historyPanel2).toBe(historyPanel);
    expect(openPanel2.className).toContain("hidden");
    expect(historyPanel2.className).not.toContain("hidden");
  });
});

describe("SpotOrdersPanel — redundant filled-quantity text", () => {
  it("a fully FILLED order (filled == quantity) does NOT repeat the quantity in parentheses", () => {
    ordersData = makeOrders(1, "FILLED", "1"); // quantity is also "1"
    render();
    clickTab("Order history");
    const [, historyPanel] = tabPanels();
    expect(historyPanel.textContent).not.toContain("(1 filled)");
  });

  it("a CANCELLED order that partially filled first still shows the genuinely useful partial amount", () => {
    ordersData = makeOrders(1, "CANCELLED", "0.4"); // quantity is "1"
    render();
    clickTab("Order history");
    const [, historyPanel] = tabPanels();
    expect(historyPanel.textContent).toContain("(0.4 filled)");
  });
});

describe("SpotOrdersPanel — existing behavior stays intact", () => {
  it("still shows the coin icon next to each pair (PairCell)", () => {
    ordersData = makeOrders(3);
    render();
    const [openPanel] = tabPanels();
    const pairCells = openPanel.querySelectorAll("tbody tr td:first-child");
    expect(pairCells.length).toBe(3);
    pairCells.forEach((cell) => {
      expect(cell.querySelector("svg")).not.toBeNull();
    });
    expect(openPanel.textContent).toContain("BTC/USDT");
  });

  it("Order history still filters out OPEN orders", () => {
    ordersData = [...makeOrders(2, "OPEN"), ...makeOrders(3, "FILLED")];
    render();
    clickTab("Order history");
    const [, historyPanel] = tabPanels();
    expect(historyPanel.querySelectorAll("tbody tr").length).toBe(3);
    expect(historyPanel.textContent).not.toContain("No order history yet.");
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

describe("SpotOrdersPanel — cancel requires confirmation first", () => {
  function clickCancelIcon() {
    const cancelButton = container.querySelector('button[aria-label="Cancel order"]')!;
    act(() => {
      (cancelButton as HTMLButtonElement).click();
    });
  }

  function confirmButton(): HTMLButtonElement {
    return Array.from(container.querySelectorAll("button")).find(
      (b) =>
        b.textContent?.trim() === "Cancel order" && b.getAttribute("aria-label") === null
    ) as HTMLButtonElement;
  }

  function backButton(): HTMLButtonElement {
    return Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Back"
    ) as HTMLButtonElement;
  }

  it("clicking the cancel icon opens a confirmation modal instead of cancelling immediately", () => {
    ordersData = makeOrders(1);
    render();
    clickCancelIcon();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Cancel order?");
    expect(container.textContent).toContain("BTC/USDT");
  });

  it("clicking Back dismisses the modal without cancelling", () => {
    ordersData = makeOrders(1);
    render();
    clickCancelIcon();
    act(() => backButton().click());
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("Cancel order?");
  });

  it("confirming in the modal actually cancels the order", () => {
    ordersData = makeOrders(1);
    render();
    clickCancelIcon();
    act(() => confirmButton().click());
    expect(mutateAsync).toHaveBeenCalledWith("order-OPEN-0");
  });

  it("shows the specific pair being cancelled when multiple different orders exist", () => {
    ordersData = [
      { ...makeOrders(1, "OPEN")[0]!, id: "order-a", symbol: "ETHUSDT" },
      { ...makeOrders(1, "OPEN")[0]!, id: "order-b", symbol: "SOLUSDT" },
    ];
    render();
    const cancelButtons = Array.from(
      container.querySelectorAll('button[aria-label="Cancel order"]')
    );
    act(() => (cancelButtons[1] as HTMLButtonElement).click());
    // Scoped to the modal card itself — ETH/USDT legitimately still
    // appears in the table underneath, which isn't what this asserts.
    const modalTitle = Array.from(container.querySelectorAll("h2")).find(
      (h) => h.textContent === "Cancel order?"
    )!;
    const modalCard = modalTitle.parentElement as HTMLElement;
    expect(modalCard.textContent).toContain("SOL/USDT");
    expect(modalCard.textContent).not.toContain("ETH/USDT");
  });
});
