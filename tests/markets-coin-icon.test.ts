// @vitest-environment jsdom
/**
 * Verifies CoinIcon actually renders a real @web3icons/react logo (an
 * <svg>, not the neutral fallback <span>) for every symbol this task
 * asked to check, and that unmapped symbols still get the safe,
 * non-random-colored fallback instead of crashing or rendering nothing.
 *
 * Rendered directly with react-dom/client (no @testing-library/react in
 * this repo — same approach as tests/markets-row-interactions.test.ts
 * and the pre-existing tests/chart-race-condition.test.ts).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoinIcon } from "@/components/markets/coin-icon";

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

describe("CoinIcon — real logos for every required symbol", () => {
  for (const symbol of REQUIRED_SYMBOLS) {
    it(`renders a real icon (svg) for ${symbol}, not the fallback`, () => {
      render(symbol);
      expect(container.querySelector("svg")).not.toBeNull();
      expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
    });
  }

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
