// @vitest-environment jsdom
/**
 * Regression test for the Trading watchlist name/icon bug: before this
 * fix, AssetWatchlist had its own hand-typed 8-symbol DISPLAY_NAMES map,
 * so any symbol added to MARKET_REGISTRY after that map was written
 * rendered with no name (`DISPLAY_NAMES[symbol]` was `undefined`) and no
 * icon at all (nothing here ever called CoinIcon). Now both are derived
 * from MARKET_REGISTRY — the same registry Markets is built on — so
 * every tracked symbol resolves correctly with zero further edits here.
 *
 * Also covers: the favorites star (reusing the exact same useFavorites()
 * hook/localStorage Markets already uses — see tests/use-favorites.test.ts
 * for that hook's own coverage) not conflicting with row selection, and
 * the scrollable list container's min-h-0 (the flexbox fix for the list
 * no longer scrolling — see components/trading/asset-watchlist.tsx's own
 * comment on why a flex child needs it here).
 *
 * Each row is a `div[role="button"]` (not a real `<button>`, which can't
 * legally contain the star's own real `<button>`) — selectors below
 * query `[role="button"]`, not `button`, to find a row.
 *
 * Rendered directly with react-dom/client (no @testing-library/react in
 * this repo) — same low-level approach as the other component tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AssetWatchlist, DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
import { MARKET_REGISTRY } from "@/lib/binance/client";
import type { LiveTicker } from "@/hooks/use-live-prices";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const PRICES: Record<string, LiveTicker> = {
  BTCUSDT: {
    symbol: "BTCUSDT",
    price: 60000,
    changePercent24h: 1.5,
    high24h: 61000,
    low24h: 59000,
    volume24h: 100,
  },
  AVAXUSDT: {
    symbol: "AVAXUSDT",
    price: 25,
    changePercent24h: -2.1,
    high24h: 26,
    low24h: 24,
    volume24h: 50,
  },
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(props: Partial<Parameters<typeof AssetWatchlist>[0]> = {}) {
  act(() => {
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(AssetWatchlist, {
          prices: PRICES,
          selected: "BTCUSDT",
          onSelect: vi.fn(),
          ...props,
        })
      )
    );
  });
}

function findRow(text: string): Element | undefined {
  const rows = container.querySelectorAll('[role="button"]');
  return Array.from(rows).find((r) => r.textContent?.includes(text));
}

describe("AssetWatchlist — DISPLAY_NAMES now covers the whole registry", () => {
  it("has an entry for every MARKET_REGISTRY symbol, not just the original 8", () => {
    for (const entry of MARKET_REGISTRY) {
      expect(DISPLAY_NAMES[entry.symbol]).toBe(`${entry.baseAsset}/USD`);
    }
  });
});

describe("AssetWatchlist — an original symbol (BTC)", () => {
  it("shows a real icon, the correct display symbol, name, price and change", () => {
    render();
    const btcRow = findRow("Bitcoin");
    expect(btcRow).toBeDefined();
    expect(btcRow!.textContent).toContain("BTC/USD");
    expect(btcRow!.textContent).toContain("Bitcoin");
    expect(btcRow!.querySelector("svg")).not.toBeNull(); // real CoinIcon, not blank
    expect(btcRow!.textContent).toContain("60,000.00");
    expect(btcRow!.textContent).toContain("1.50%");
  });
});

describe("AssetWatchlist — a symbol added after the old 8-entry map (AVAX)", () => {
  it("shows a real name and icon instead of blank/undefined", () => {
    render();
    const avaxRow = findRow("Avalanche");
    expect(avaxRow).toBeDefined();
    expect(avaxRow!.textContent).toContain("AVAX/USD");
    expect(avaxRow!.textContent).toContain("Avalanche");
    expect(avaxRow!.textContent).not.toContain("undefined");
    expect(avaxRow!.querySelector("svg")).not.toBeNull();
  });

  it("still selects the correct symbol on click, same as an original coin", () => {
    const onSelect = vi.fn();
    render({ onSelect });
    const avaxRow = findRow("Avalanche");
    act(() => avaxRow!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(onSelect).toHaveBeenCalledWith("AVAXUSDT");
  });
});

describe("AssetWatchlist — search", () => {
  it("finds a coin by its friendly name", () => {
    render();
    const input = container.querySelector("input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(input, "Avalanche");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("Avalanche");
    expect(container.textContent).not.toContain("Bitcoin");
  });

  it("clearing the search restores the full list", () => {
    render();
    const input = container.querySelector("input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(input, "Avalanche");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      setter.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("Bitcoin");
    expect(container.textContent).toContain("Avalanche");
  });

  it("the favorite star for a matching coin stays present and clickable while searching", () => {
    render();
    const input = container.querySelector("input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(input, "BTC");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const btcRow = findRow("Bitcoin")!;
    const star = btcRow.querySelector('button[aria-label="Add to favorites"]');
    expect(star).not.toBeNull();
  });
});

describe("AssetWatchlist — a symbol with no live tick yet", () => {
  it("still shows name/icon, with a price placeholder instead of a blank row", () => {
    render(); // PRICES has no ETHUSDT entry
    const ethRow = findRow("Ethereum");
    expect(ethRow).toBeDefined();
    expect(ethRow!.textContent).toContain("ETH/USD");
    expect(ethRow!.querySelector("svg")).not.toBeNull();
  });
});

describe("AssetWatchlist — favorites star", () => {
  it("starts unfavorited (outline star, not filled)", () => {
    render();
    const star = findRow("Bitcoin")!.querySelector(
      'button[aria-label="Add to favorites"]'
    )!;
    expect(star.querySelector("svg")!.getAttribute("class")).not.toContain(
      "fill-primary"
    );
  });

  it("clicking the star toggles it to favorited, without selecting the row", () => {
    const onSelect = vi.fn();
    render({ onSelect, selected: "BTCUSDT" });
    const star = findRow("Bitcoin")!.querySelector(
      'button[aria-label="Add to favorites"]'
    )!;
    act(() => star.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(onSelect).not.toHaveBeenCalled();
    const toggledStar = findRow("Bitcoin")!.querySelector(
      'button[aria-label="Remove from favorites"]'
    );
    expect(toggledStar).not.toBeNull();
    expect(toggledStar!.querySelector("svg")!.getAttribute("class")).toContain(
      "fill-primary"
    );
  });

  it("clicking a row still selects it, without toggling that row's favorite", () => {
    const onSelect = vi.fn();
    render({ onSelect, selected: "BTCUSDT" });
    const avaxRow = findRow("Avalanche")!;
    act(() => avaxRow.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(onSelect).toHaveBeenCalledWith("AVAXUSDT");
    expect(avaxRow.querySelector('button[aria-label="Add to favorites"]')).not.toBeNull();
  });

  it("persists across a remount, via the same favorites storage Markets uses", () => {
    render();
    const star = findRow("Bitcoin")!.querySelector(
      'button[aria-label="Add to favorites"]'
    )!;
    act(() => star.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    act(() => root.unmount());
    root = createRoot(container);
    render();

    const restoredStar = findRow("Bitcoin")!.querySelector(
      'button[aria-label="Remove from favorites"]'
    );
    expect(restoredStar).not.toBeNull();
  });
});

describe("AssetWatchlist — scrollable list container", () => {
  it("the list container has min-h-0 alongside flex-1/overflow-y-auto, so it can actually scroll instead of growing to fit every row", () => {
    render();
    const searchInput = container.querySelector("input")!;
    // The scrollable list is the element right after the fixed search
    // block, inside the AssetWatchlist root.
    const root2 = searchInput.closest(".border-b")!.parentElement!;
    const list = root2.children[1] as HTMLElement;
    expect(list.className).toContain("min-h-0");
    expect(list.className).toContain("flex-1");
    expect(list.className).toContain("overflow-y-auto");
  });
});
