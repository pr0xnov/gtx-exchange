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
      React.createElement(AssetWatchlist, {
        prices: PRICES,
        selected: "BTCUSDT",
        onSelect: vi.fn(),
        ...props,
      })
    );
  });
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
    const buttons = container.querySelectorAll("button");
    const btcButton = Array.from(buttons).find((b) => b.textContent?.includes("Bitcoin"));
    expect(btcButton).toBeDefined();
    expect(btcButton!.textContent).toContain("BTC/USD");
    expect(btcButton!.textContent).toContain("Bitcoin");
    expect(btcButton!.querySelector("svg")).not.toBeNull(); // real CoinIcon, not blank
    expect(btcButton!.textContent).toContain("60,000.00");
    expect(btcButton!.textContent).toContain("1.50%");
  });
});

describe("AssetWatchlist — a symbol added after the old 8-entry map (AVAX)", () => {
  it("shows a real name and icon instead of blank/undefined", () => {
    render();
    const buttons = container.querySelectorAll("button");
    const avaxButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("Avalanche")
    );
    expect(avaxButton).toBeDefined();
    expect(avaxButton!.textContent).toContain("AVAX/USD");
    expect(avaxButton!.textContent).toContain("Avalanche");
    expect(avaxButton!.textContent).not.toContain("undefined");
    expect(avaxButton!.querySelector("svg")).not.toBeNull();
  });

  it("still selects the correct symbol on click, same as an original coin", () => {
    const onSelect = vi.fn();
    render({ onSelect });
    const buttons = container.querySelectorAll("button");
    const avaxButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("Avalanche")
    );
    act(() => avaxButton!.dispatchEvent(new MouseEvent("click", { bubbles: true })));
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
});

describe("AssetWatchlist — a symbol with no live tick yet", () => {
  it("still shows name/icon, with a price placeholder instead of a blank row", () => {
    render(); // PRICES has no ETHUSDT entry
    const buttons = container.querySelectorAll("button");
    const ethButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("Ethereum")
    );
    expect(ethButton).toBeDefined();
    expect(ethButton!.textContent).toContain("ETH/USD");
    expect(ethButton!.querySelector("svg")).not.toBeNull();
  });
});
