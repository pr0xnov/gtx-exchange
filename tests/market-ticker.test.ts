// @vitest-environment jsdom
/**
 * Component tests for Trading's bottom market ticker
 * (components/trading/market-ticker.tsx) — reuses the SAME `prices` map
 * TradingTerminal already gets from useLivePrices() (passed in as a
 * prop here, never a hook call of its own), so there is no second
 * subscription to test/verify separately from tests/trading-terminal.test.ts,
 * which covers it being actually mounted on the page.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MarketTicker } from "@/components/trading/market-ticker";
import { POPULAR_SYMBOLS } from "@/lib/binance/client";
import type { LiveTicker } from "@/hooks/use-live-prices";

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
  vi.unstubAllGlobals();
});

function samplePrices(): Record<string, LiveTicker> {
  const prices: Record<string, LiveTicker> = {};
  for (const symbol of POPULAR_SYMBOLS) {
    prices[symbol] = {
      symbol,
      price: 100,
      changePercent24h: symbol === "BTCUSDT" ? 2.15 : -1.5,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
    };
  }
  return prices;
}

function render(prices: Record<string, LiveTicker>, onSelect = vi.fn()) {
  act(() => {
    root.render(React.createElement(MarketTicker, { prices, onSelect }));
  });
  return onSelect;
}

describe("MarketTicker — persistent viewport-bottom positioning", () => {
  it("is fixed to the viewport, spans full width, and sits above page content but below the z-50 modal/dropdown layer", () => {
    render(samplePrices());
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("fixed");
    expect(root.className).toContain("inset-x-0");
    expect(root.className).toContain("bottom-0");
    expect(root.className).toContain("z-40");
    // Below every existing modal/dropdown/Navbar (all z-50) so a modal is
    // never covered by it.
    expect(root.className).not.toContain("z-50");
  });

  it("has its own opaque background (fixed elements no longer inherit page background from normal flow)", () => {
    render(samplePrices());
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("bg-background");
  });

  it("never captures vertical scroll — no overflow-y scroll classes, only horizontal clipping", () => {
    render(samplePrices());
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain("overflow-y-auto");
    expect(root.className).not.toContain("overflow-y-scroll");
    expect(root.className).not.toContain("overscroll");
  });
});

describe("MarketTicker — real content from the shared prices map", () => {
  it("renders every popular pair's symbol, price, and 24h change", () => {
    render(samplePrices());
    for (const symbol of POPULAR_SYMBOLS) {
      const base = symbol.replace("USDT", "");
      expect(container.textContent).toContain(`${base}/USDT`);
    }
    expect(container.textContent).toContain("+2.15%");
  });

  it("colors a positive change green (text-primary) and a negative change red (text-danger)", () => {
    render(samplePrices());
    const buttons = Array.from(container.querySelectorAll("button"));
    const btcButton = buttons.find((b) => b.textContent?.includes("BTC/USDT"))!;
    const ethButton = buttons.find((b) => b.textContent?.includes("ETH/USDT"))!;

    const btcPercent = btcButton.querySelector(".text-primary, .text-danger")!;
    expect(btcPercent.className).toContain("text-primary");

    const ethPercent = ethButton.querySelector(".text-primary, .text-danger")!;
    expect(ethPercent.className).toContain("text-danger");
  });

  it("shows a placeholder, not a crash, for a symbol with no price yet", () => {
    render({});
    expect(container.textContent).toContain("BTC/USDT");
    expect(container.textContent).toContain("—");
  });
});

describe("MarketTicker — seamless loop structure", () => {
  it("renders the sequence twice for a seamless loop, with the second copy hidden from assistive tech and tab order", () => {
    render(samplePrices());
    const track = container.firstElementChild!.firstElementChild!;
    expect(track.children.length).toBe(2);
    const first = track.children[0]!;
    const second = track.children[1]!;
    expect(first.getAttribute("aria-hidden")).toBe("false");
    expect(second.getAttribute("aria-hidden")).toBe("true");
    const secondButton = second.querySelector("button")!;
    expect(secondButton.tabIndex).toBe(-1);
  });

  it("never uses a hardcoded translate distance — the animation distance is a CSS variable set from a real measurement", () => {
    render(samplePrices());
    const track = container.firstElementChild!.firstElementChild! as HTMLElement;
    expect(track.style.getPropertyValue("--gtx-ticker-distance")).toMatch(
      /^-?\d+(\.\d+)?px$/
    );
  });
});

describe("MarketTicker — hover pauses, mouse leave resumes", () => {
  // React synthesizes onMouseEnter/onMouseLeave from the native bubbling
  // mouseover/mouseout events, not from mouseenter/mouseleave directly —
  // dispatching the literal enter/leave events is silently ignored (same
  // pattern as tests/navbar.test.ts).
  it("sets animation-play-state to paused on hover and running again on leave", () => {
    render(samplePrices());
    const viewport = container.firstElementChild as HTMLElement;
    const track = viewport.firstElementChild as HTMLElement;

    expect(track.style.animationPlayState).toBe("running");

    act(() => {
      viewport.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(track.style.animationPlayState).toBe("paused");

    act(() => {
      viewport.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(track.style.animationPlayState).toBe("running");
  });
});

describe("MarketTicker — clicking a pair selects it (same mechanism as the sidebar)", () => {
  it("calls onSelect with that pair's symbol", () => {
    const onSelect = render(samplePrices());
    const solButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("SOL/USDT")
    )!;
    act(() => {
      solButton.click();
    });
    expect(onSelect).toHaveBeenCalledWith("SOLUSDT");
  });
});

describe("MarketTicker — prefers-reduced-motion: a static, manually-scrollable list instead", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    );
  });

  it("renders only ONE sequence, with no animation class, inside a manually horizontally-scrollable container", () => {
    render(samplePrices());
    const viewport = container.firstElementChild as HTMLElement;
    expect(viewport.className).toContain("overflow-x-auto");
    // Still pinned to the viewport bottom even in the static fallback.
    expect(viewport.className).toContain("fixed");
    expect(viewport.className).toContain("bottom-0");
    // Only one sequence of buttons — not doubled for a loop that isn't running.
    const solButtons = Array.from(container.querySelectorAll("button")).filter((b) =>
      b.textContent?.includes("SOL/USDT")
    );
    expect(solButtons).toHaveLength(1);
  });

  it("the pair is still clickable in the static fallback", () => {
    const onSelect = render(samplePrices());
    const solButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("SOL/USDT")
    )!;
    act(() => {
      solButton.click();
    });
    expect(onSelect).toHaveBeenCalledWith("SOLUSDT");
  });
});

describe("MarketTicker — no matchMedia support at all (defensive, matches the MarketCarousel guard elsewhere)", () => {
  it("still renders normally instead of throwing", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(() => render(samplePrices())).not.toThrow();
    expect(container.textContent).toContain("BTC/USDT");
  });
});
