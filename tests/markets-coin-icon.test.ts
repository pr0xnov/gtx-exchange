// @vitest-environment jsdom
/**
 * Verifies CoinIcon:
 *  - renders a real @web3icons/react logo (an <svg>, not the fallback)
 *    for BTC/ETH and every other symbol this icon set actually covers;
 *  - normalizes a full trading pair ("BTCUSDT") to the same icon as the
 *    bare ticker ("BTC");
 *  - never throws for any symbol in the current MARKET_REGISTRY (~95
 *    symbols), falling back to the neutral initial badge for the
 *    handful this icon set doesn't have real art for — never a random
 *    color, never a crash;
 *  - is the one component every Markets table (MiniMarketTable) renders
 *    through — not a different icon source per table.
 *
 * Rendered directly with react-dom/client (no @testing-library/react in
 * this repo — same approach as tests/markets-row-interactions.test.ts
 * and the pre-existing tests/chart-race-condition.test.ts).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoinIcon } from "@/components/markets/coin-icon";
import { MiniMarketTable } from "@/components/markets/mini-market-table";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { MARKET_REGISTRY } from "@/lib/binance/client";
import { mergeMarketData } from "@/lib/markets/derive";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Symbols this task's own checklist named that have no real icon in
// @web3icons/react (verified against node_modules/@web3icons/react) —
// expected to render the fallback, not an error.
const KNOWN_FALLBACK_TICKERS = new Set([
  "ACE",
  "ALT",
  "ANKR",
  "BICO",
  "BONK",
  "ENA",
  "FLOKI",
  "MANTA",
  "NOT",
  "ONDO",
  "PNUT",
  "S",
  "VANRY",
  "WLD",
]);

const REQUIRED_SYMBOLS = [
  "BTC",
  "ETH",
  "USDT",
  "BNB",
  "USDC",
  "XRP",
  "SOL",
  "TRX",
  "DOGE",
  "LTC",
  "ADA",
  "AVAX",
  "LINK",
];

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

function render(symbol: string) {
  act(() => {
    root.render(React.createElement(CoinIcon, { symbol }));
  });
}

describe("CoinIcon — real logos for the required symbols", () => {
  for (const symbol of REQUIRED_SYMBOLS) {
    it(`renders a real icon (svg) for ${symbol}, not the fallback`, () => {
      render(symbol);
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
    });
  }

  it("BTC maps to a real icon", () => {
    render("BTC");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("ETH maps to a real icon", () => {
    render("ETH");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("BTCUSDT normalizes to the same BTC icon as the bare ticker", () => {
    render("BTCUSDT");
    const withPair = container.innerHTML;
    render("BTC");
    const bare = container.innerHTML;
    expect(withPair).toBe(bare);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("ETHUSDT normalizes to the same ETH icon as the bare ticker", () => {
    render("ETHUSDT");
    const withPair = container.innerHTML;
    render("ETH");
    const bare = container.innerHTML;
    expect(withPair).toBe(bare);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("accepts lowercase input the same way (symbol is upper-cased internally)", () => {
    render("btc");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("falls back to a neutral initial badge for a symbol with no real icon, instead of crashing", () => {
    render("NOPE");
    expect(container.querySelector("svg")).toBeNull();
    const fallback = container.querySelector('span[aria-hidden="true"]');
    expect(fallback).not.toBeNull();
    expect(fallback!.textContent).toBe("N");
  });

  it("every rendered icon (real or fallback) is the same fixed 24x24 size", () => {
    for (const symbol of [...REQUIRED_SYMBOLS, "NOPE"]) {
      render(symbol);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toContain("h-6");
      expect(wrapper.className).toContain("w-6");
      expect(wrapper.className).toContain("shrink-0");
    }
  });
});

describe("CoinIcon — every symbol in MARKET_REGISTRY (~95 symbols)", () => {
  it("renders without throwing for every registry symbol, as either a real icon or the safe fallback", () => {
    let realIconCount = 0;
    let fallbackCount = 0;

    for (const entry of MARKET_REGISTRY) {
      expect(() => render(entry.symbol)).not.toThrow();

      const hasRealIcon = container.querySelector("svg") !== null;
      const hasFallback = container.querySelector('span[aria-hidden="true"]') !== null;
      expect(hasRealIcon || hasFallback).toBe(true);

      if (hasRealIcon) {
        realIconCount++;
      } else {
        fallbackCount++;
        // Only the specific, known-uncovered tickers may fall back —
        // anything else falling back would mean a real icon regressed.
        expect(KNOWN_FALLBACK_TICKERS.has(entry.baseAsset)).toBe(true);
      }
    }

    expect(realIconCount + fallbackCount).toBe(MARKET_REGISTRY.length);
    expect(realIconCount).toBeGreaterThan(MARKET_REGISTRY.length * 0.5);
    // Surfaced for the final report, not asserted on beyond sanity above.
    console.log(
      `[CoinIcon coverage] ${realIconCount}/${MARKET_REGISTRY.length} real icons, ${fallbackCount} fallback`
    );
  });
});

describe("CoinIcon — the only icon source used by every Markets table", () => {
  it("MiniMarketTable renders the CoinIcon wrapper (not a different icon per table)", () => {
    const rows = mergeMarketData(
      [
        {
          id: "1",
          symbol: "BTCUSDT",
          displaySymbol: "BTC/USD",
          price: 60000,
          change24h: 1,
        },
      ],
      {}
    );
    act(() => {
      root.render(
        React.createElement(
          LocaleProvider,
          { initialLocale: "en" },
          React.createElement(MiniMarketTable, {
            title: "Test",
            rows,
            isLoading: false,
            favorites: new Set<string>(),
            onToggleFavorite: () => {},
            sparklines: {},
            isAuthenticated: true,
          })
        )
      );
    });

    // 1=№, 2=Монета (the favorite star lives inside this same cell now,
    // not a separate column — see mini-market-table.tsx's fixed
    // 5/25/13/12/16/29% column layout).
    const coinCell = container.querySelector("tbody tr td:nth-child(2)");
    expect(coinCell?.querySelector(".rounded-full")).not.toBeNull();
    expect(coinCell?.querySelector("svg")).not.toBeNull();
  });
});
