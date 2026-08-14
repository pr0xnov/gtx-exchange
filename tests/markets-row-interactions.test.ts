// @vitest-environment jsdom
/**
 * Verifies the row-click / star-column contract of MiniMarketTable — the
 * single table renderer every Markets block (Все криптовалюты,
 * Избранные, Популярные, Показывают рост, Теряют в цене, Максимальный
 * объём, Наибольшее движение) renders through — for BOTH a guest and an
 * authenticated user:
 *
 *  - row click always navigates towards Trading, using whatever symbol
 *    that row actually has; an authenticated user goes straight to
 *    /trading?symbol=...; a guest goes to /login (since /trading is
 *    auth-protected — middleware.ts), with the intended destination
 *    preserved in `redirect` — unchanged from before;
 *  - favorites are an authenticated-account feature: an authenticated
 *    user sees a star per row and can toggle it (never triggering the
 *    row's own navigation — stopPropagation); a guest sees NO star
 *    column at all — no button to find, click, or accidentally trigger
 *    anything through.
 *
 * Rendered directly with react-dom/client (no @testing-library/react in
 * this repo) — the same low-level approach already established by
 * tests/chart-race-condition.test.ts for testing a real component.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MiniMarketTable } from "@/components/markets/mini-market-table";
import { mergeMarketData } from "@/lib/markets/derive";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const rows = mergeMarketData(
  [
    {
      id: "1",
      symbol: "BTCUSDT",
      displaySymbol: "BTC/USD",
      price: 60000,
      change24h: 1.2,
    },
    {
      id: "2",
      symbol: "ETHUSDT",
      displaySymbol: "ETH/USD",
      price: 3000,
      change24h: -0.5,
    },
  ],
  {}
);

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  pushMock.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderTable(options: {
  isAuthenticated: boolean;
  onToggleFavorite?: (symbol: string) => void;
  favorites?: Set<string>;
}) {
  act(() => {
    root.render(
      React.createElement(MiniMarketTable, {
        title: "Test",
        rows,
        isLoading: false,
        favorites: options.favorites ?? new Set<string>(),
        onToggleFavorite: options.onToggleFavorite ?? vi.fn(),
        sparklines: {},
        isAuthenticated: options.isAuthenticated,
      })
    );
  });
}

function click(el: Element | null) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function starButtons() {
  return container.querySelectorAll(
    'button[aria-label="Add to favorites"], button[aria-label="Remove from favorites"]'
  );
}

describe("MiniMarketTable — authenticated user", () => {
  it("row click routes straight to /trading with the clicked row's own symbol", () => {
    renderTable({ isAuthenticated: true });
    const secondRow = container.querySelectorAll("tbody tr")[1];
    click(secondRow!);
    expect(pushMock).toHaveBeenCalledWith("/trading?symbol=ETHUSDT");
  });

  it("BTC row click routes to /trading?symbol=BTCUSDT", () => {
    renderTable({ isAuthenticated: true });
    const firstRow = container.querySelectorAll("tbody tr")[0];
    click(firstRow!);
    expect(pushMock).toHaveBeenCalledWith("/trading?symbol=BTCUSDT");
  });

  it("sees a star button for every row", () => {
    renderTable({ isAuthenticated: true });
    expect(starButtons()).toHaveLength(rows.length);
  });

  it("star click adds a favorite (not yet favorited -> toggle called)", () => {
    const onToggleFavorite = vi.fn();
    renderTable({ isAuthenticated: true, onToggleFavorite, favorites: new Set() });
    click(starButtons()[0]!);
    expect(onToggleFavorite).toHaveBeenCalledWith("BTCUSDT");
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it("star click removes an existing favorite (already favorited -> toggle still called)", () => {
    const onToggleFavorite = vi.fn();
    renderTable({
      isAuthenticated: true,
      onToggleFavorite,
      favorites: new Set(["BTCUSDT"]),
    });
    const button = container.querySelector('button[aria-label="Remove from favorites"]');
    click(button);
    expect(onToggleFavorite).toHaveBeenCalledWith("BTCUSDT");
  });

  it("star click never navigates (stopPropagation)", () => {
    renderTable({ isAuthenticated: true });
    click(starButtons()[0]!);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clicking elsewhere in the row (not the star) still navigates", () => {
    renderTable({ isAuthenticated: true });
    const priceCell = container.querySelector("tbody tr td:nth-child(4)");
    click(priceCell);
    expect(pushMock).toHaveBeenCalledWith("/trading?symbol=BTCUSDT");
  });
});

describe("MiniMarketTable — guest", () => {
  it("renders NO star button at all, for any row — not just inert, entirely absent", () => {
    renderTable({ isAuthenticated: false });
    expect(starButtons()).toHaveLength(0);
    expect(container.querySelector('[aria-label*="favorites"]')).toBeNull();
  });

  it("never calls onToggleFavorite — there is no control that could reach it", () => {
    const onToggleFavorite = vi.fn();
    renderTable({ isAuthenticated: false, onToggleFavorite });
    // Nothing to click for favorites; clicking every cell in the row
    // must never reach onToggleFavorite.
    const firstRow = container.querySelectorAll("tbody tr")[0]!;
    for (const cell of Array.from(firstRow.querySelectorAll("td"))) {
      click(cell);
    }
    expect(onToggleFavorite).not.toHaveBeenCalled();
  });

  it("row click still routes towards Trading, via /login with the destination preserved (auth-protected route)", () => {
    renderTable({ isAuthenticated: false });
    const firstRow = container.querySelectorAll("tbody tr")[0];
    click(firstRow!);
    expect(pushMock).toHaveBeenCalledWith(
      `/login?redirect=${encodeURIComponent("/trading?symbol=BTCUSDT")}`
    );
  });

  it("BTC row click still resolves to the BTCUSDT symbol inside the /login redirect", () => {
    renderTable({ isAuthenticated: false });
    const firstRow = container.querySelectorAll("tbody tr")[0];
    click(firstRow!);
    const [url] = pushMock.mock.calls[0]!;
    expect(decodeURIComponent(url)).toContain("/trading?symbol=BTCUSDT");
  });
});

describe("MiniMarketTable — hover state (same for guest and authenticated)", () => {
  it("every row carries the shared hover/cursor classes covering the whole row (authenticated)", () => {
    renderTable({ isAuthenticated: true });
    const firstRow = container.querySelectorAll("tbody tr")[0] as HTMLElement;
    expect(firstRow.className).toContain("hover:bg-white/[0.02]");
    expect(firstRow.className).toContain("cursor-pointer");
  });

  it("every row carries the same hover/cursor classes for a guest too", () => {
    renderTable({ isAuthenticated: false });
    const firstRow = container.querySelectorAll("tbody tr")[0] as HTMLElement;
    expect(firstRow.className).toContain("hover:bg-white/[0.02]");
    expect(firstRow.className).toContain("cursor-pointer");
  });
});
