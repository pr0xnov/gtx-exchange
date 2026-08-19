// @vitest-environment jsdom
/**
 * Component tests for Trading's Spot order panel
 * (components/trading/spot-order-panel.tsx): Available balance per
 * side, the Quantity <-> Slider sync, clamping to the real max, and
 * that BUY's ceiling comes from USDT while SELL's comes from the coin
 * balance — all sourced from useSpotWallet() (mocked here to a fixed,
 * known SpotWallet snapshot), never guessed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SpotOrderPanel } from "@/components/trading/spot-order-panel";
import { LocaleProvider } from "@/lib/i18n/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mutateAsync = vi.fn().mockResolvedValue({});
vi.mock("@/hooks/use-api", () => ({
  useCreateSpotOrder: () => ({ mutateAsync, isPending: false }),
  useSpotWallet: () => ({
    data: [
      { currency: "USDT", balance: 65.94, locked: 0 },
      { currency: "BTC", balance: 0.027464, locked: 0 },
    ],
    isLoading: false,
  }),
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
        React.createElement(SpotOrderPanel, {
          symbol: "BTCUSDT",
          displayName: "BTC/USD",
          livePrice: 63620,
        })
      )
    );
  });
}

function quantityInput(): HTMLInputElement {
  return container.querySelector('input[type="number"]') as HTMLInputElement;
}

function sliderInput(): HTMLInputElement {
  return container.querySelector('input[type="range"]') as HTMLInputElement;
}

function setValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function clickButton(text: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === text
  );
  act(() => {
    button!.click();
  });
}

describe("SpotOrderPanel — Available balance per side", () => {
  it("shows the real available USDT for BUY (default side)", () => {
    render();
    expect(container.textContent).toContain("$65.94");
    expect(container.textContent).toContain("USDT");
  });

  it("shows the real available BTC balance after switching to SELL", () => {
    render();
    clickButton("Sell");
    expect(container.textContent).toContain("0.027464");
    expect(container.textContent).toContain("BTC");
  });
});

describe("SpotOrderPanel — Quantity <-> Slider sync", () => {
  it("moving the slider to 100% sets quantity to the real BUY max (USDT / price)", () => {
    render();
    setValue(sliderInput(), "100");
    const expectedMax = Math.floor((65.94 / 63620) * 1e8) / 1e8;
    expect(parseFloat(quantityInput().value)).toBeCloseTo(expectedMax, 6);
  });

  it("moving the slider to 50% sets quantity to half the max", () => {
    render();
    setValue(sliderInput(), "50");
    const half = parseFloat(quantityInput().value);
    setValue(sliderInput(), "100");
    const full = parseFloat(quantityInput().value);
    expect(half).toBeCloseTo(full / 2, 6);
  });

  it("moving the slider to 0% sets quantity to 0", () => {
    render();
    setValue(sliderInput(), "0");
    expect(parseFloat(quantityInput().value)).toBe(0);
  });

  it("typing a quantity manually moves the slider to match", () => {
    render();
    const max = Math.floor((65.94 / 63620) * 1e8) / 1e8;
    setValue(quantityInput(), String(max / 2));
    expect(Number(sliderInput().value)).toBeCloseTo(50, 0);
  });
});

describe("SpotOrderPanel — clamping to the real max", () => {
  it("typing more than the available USDT can buy clamps down to the max for BUY", () => {
    render();
    setValue(quantityInput(), "10"); // far more than 65.94 USDT can buy at 63,620
    const max = Math.floor((65.94 / 63620) * 1e8) / 1e8;
    expect(parseFloat(quantityInput().value)).toBeCloseTo(max, 8);
  });

  it("typing more than the held BTC balance clamps down to that balance for SELL", () => {
    render();
    clickButton("Sell");
    setValue(quantityInput(), "5"); // far more than the 0.027464 BTC held
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.027464, 8);
  });

  it("re-clamps an existing quantity when switching from BUY to SELL", () => {
    render();
    const buyMax = Math.floor((65.94 / 63620) * 1e8) / 1e8;
    setValue(quantityInput(), String(buyMax)); // valid for BUY
    clickButton("Sell");
    // BTC balance (0.027464) is far smaller than the USDT-derived buy max
    // was — the leftover quantity from BUY must not silently exceed it.
    expect(parseFloat(quantityInput().value)).toBeLessThanOrEqual(0.027464 + 1e-9);
  });
});

describe("SpotOrderPanel — BUY vs SELL use different ceilings", () => {
  it("BUY's ceiling comes from the USDT balance, not the coin balance", () => {
    render();
    setValue(sliderInput(), "100");
    const buyMax = parseFloat(quantityInput().value);
    expect(buyMax).toBeCloseTo(65.94 / 63620, 6);
    expect(buyMax).not.toBeCloseTo(0.027464, 6);
  });

  it("SELL's ceiling comes from the coin balance, not the USDT balance", () => {
    render();
    clickButton("Sell");
    setValue(sliderInput(), "100");
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.027464, 8);
  });
});

describe("SpotOrderPanel — submit", () => {
  it("submits a BUY with the exact quantity shown", () => {
    render();
    setValue(sliderInput(), "50");
    const qty = parseFloat(quantityInput().value);
    clickButton("Buy BTC");
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ side: "BUY", type: "MARKET", quantity: qty })
    );
  });

  it("submits a SELL with the exact quantity shown", () => {
    render();
    clickButton("Sell");
    setValue(sliderInput(), "100");
    const qty = parseFloat(quantityInput().value);
    clickButton("Sell BTC");
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ side: "SELL", type: "MARKET", quantity: qty })
    );
  });
});
