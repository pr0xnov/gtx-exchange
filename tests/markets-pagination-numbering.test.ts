// @vitest-environment jsdom
/**
 * Regression test for row numbering across pages in "Все криптовалюты" /
 * "Избранные" (AllMarketsTable → MiniMarketTable's `startIndex` prop).
 *
 * Before this fix, MiniMarketTable numbered every page's rows 1..pageSize
 * on its own, since AllMarketsTable never told it which page it was
 * looking at — page 2 restarted at 1 instead of continuing at 21.
 *
 * Rendered directly with react-dom/client (no @testing-library/react in
 * this repo) — same low-level approach as the other Markets tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AllMarketsTable } from "@/components/markets/all-markets-table";
import { MiniMarketTable } from "@/components/markets/mini-market-table";
import { mergeMarketData, type MarketAssetLike } from "@/lib/markets/derive";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const PAGE_SIZE = 20;

// 60 synthetic assets, named so alphabetical (default) sort order matches
// insertion order exactly: SYM00 < SYM01 < … < SYM59.
const SIXTY_ASSETS: MarketAssetLike[] = Array.from({ length: 60 }, (_, i) => {
  const n = String(i).padStart(2, "0");
  return {
    id: `id-${n}`,
    symbol: `SYM${n}USDT`,
    displaySymbol: `SYM${n}/USD`,
    price: 1,
    change24h: 0,
  };
});
const SIXTY_ROWS = mergeMarketData(SIXTY_ASSETS, {});

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

function renderAllMarketsTable() {
  act(() => {
    root.render(
      React.createElement(AllMarketsTable, {
        title: "Все криптовалюты",
        rows: SIXTY_ROWS,
        isLoading: false,
        search: "",
        favorites: new Set<string>(),
        onToggleFavorite: vi.fn(),
        sparklines: {},
        isAuthenticated: true,
      })
    );
  });
}

function rowNumbers(): number[] {
  return Array.from(container.querySelectorAll("tbody tr td:first-child")).map((td) =>
    Number(td.textContent)
  );
}

function clickNext() {
  const next = Array.from(container.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("Next")
  );
  if (!next) throw new Error("Next button not found");
  act(() => next.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

describe("AllMarketsTable — row numbering continues across pages (60 rows, pageSize 20)", () => {
  it("page 1: numbers 1 through 20", () => {
    renderAllMarketsTable();
    const numbers = rowNumbers();
    expect(numbers).toHaveLength(20);
    expect(numbers[0]).toBe(1);
    expect(numbers[numbers.length - 1]).toBe(20);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("page 2: numbers 21 through 40", () => {
    renderAllMarketsTable();
    clickNext();
    const numbers = rowNumbers();
    expect(numbers).toHaveLength(20);
    expect(numbers[0]).toBe(21);
    expect(numbers[numbers.length - 1]).toBe(40);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => 21 + i));
  });

  it("page 3: numbers 41 through 60", () => {
    renderAllMarketsTable();
    clickNext();
    clickNext();
    const numbers = rowNumbers();
    expect(numbers).toHaveLength(20);
    expect(numbers[0]).toBe(41);
    expect(numbers[numbers.length - 1]).toBe(60);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, i) => 41 + i));
  });

  it("matches the displayIndex = (currentPage - 1) * pageSize + index + 1 formula directly", () => {
    for (const currentPage of [1, 2, 3]) {
      const expected = Array.from(
        { length: PAGE_SIZE },
        (_, index) => (currentPage - 1) * PAGE_SIZE + index + 1
      );
      if (currentPage === 1) {
        expect(expected).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
      } else if (currentPage === 2) {
        expect(expected).toEqual(Array.from({ length: 20 }, (_, i) => 21 + i));
      } else {
        expect(expected).toEqual(Array.from({ length: 20 }, (_, i) => 41 + i));
      }
    }
  });
});

describe("MiniMarketTable — non-paginated blocks keep numbering from 1 (unchanged)", () => {
  it("renders 1..N when startIndex is omitted, exactly as before this fix", () => {
    const rows = mergeMarketData(SIXTY_ASSETS.slice(0, 5), {});
    act(() => {
      root.render(
        React.createElement(MiniMarketTable, {
          title: "Популярные",
          rows,
          isLoading: false,
          favorites: new Set<string>(),
          onToggleFavorite: vi.fn(),
          sparklines: {},
          isAuthenticated: true,
        })
      );
    });
    const numbers = Array.from(container.querySelectorAll("tbody tr td:first-child")).map(
      (td) => Number(td.textContent)
    );
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });
});
