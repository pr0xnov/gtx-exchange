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
let walletData = [
  { currency: "USDT", balance: 65.94, locked: 0 },
  { currency: "BTC", balance: 0.027464, locked: 0 },
];
vi.mock("@/hooks/use-api", () => ({
  useCreateSpotOrder: () => ({ mutateAsync, isPending: false }),
  useSpotWallet: () => ({ data: walletData, isLoading: false }),
}));

const DEFAULT_WALLET = [
  { currency: "USDT", balance: 65.94, locked: 0 },
  { currency: "BTC", balance: 0.027464, locked: 0 },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mutateAsync.mockClear();
  walletData = DEFAULT_WALLET;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(
  overrides: Partial<{ symbol: string; displayName: string; livePrice: number }> = {}
) {
  act(() => {
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(SpotOrderPanel, {
          symbol: "BTCUSDT",
          displayName: "BTC/USD",
          livePrice: 63620,
          ...overrides,
        })
      )
    );
  });
}

function quantityInput(): HTMLInputElement {
  return container.querySelector("#spot-order-quantity") as HTMLInputElement;
}

function quoteAmountInput(): HTMLInputElement | null {
  return container.querySelector("#spot-order-quote-amount");
}

function limitPriceInput(): HTMLInputElement | null {
  return container.querySelector("#spot-order-limit-price");
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
    expect(container.textContent).toContain("65.94 USDT");
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

describe("SpotOrderPanel — BUY by exact USDT amount", () => {
  it("shows an Amount (USDT) field for BUY, hidden for SELL", () => {
    render();
    expect(quoteAmountInput()).not.toBeNull();
    clickButton("Sell");
    expect(quoteAmountInput()).toBeNull();
  });

  it("MARKET: entering 400 USDT at a price of 80,000 computes 0.005 BTC", () => {
    walletData = [
      { currency: "USDT", balance: 10_000, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
    render({ livePrice: 80000 });
    setValue(quoteAmountInput()!, "400");
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.005, 8);
  });

  it("MARKET: entering 0.01 BTC at a price of 80,000 computes 800 USDT", () => {
    walletData = [
      { currency: "USDT", balance: 10_000, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
    render({ livePrice: 80000 });
    setValue(quantityInput(), "0.01");
    expect(parseFloat(quoteAmountInput()!.value)).toBeCloseTo(800, 2);
  });

  it("LIMIT: uses the entered limit price, not the live market price, for the USDT<->quantity link", () => {
    walletData = [
      { currency: "USDT", balance: 10_000, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
    render({ livePrice: 999999 }); // deliberately far from the limit price
    clickButton("Limit");
    setValue(limitPriceInput()!, "70000");
    setValue(quoteAmountInput()!, "700");
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.01, 8);
  });

  it("changing the limit price recalculates quantity from the preserved USDT amount", () => {
    walletData = [
      { currency: "USDT", balance: 10_000, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
    render();
    clickButton("Limit");
    setValue(limitPriceInput()!, "70000");
    setValue(quoteAmountInput()!, "700");
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.01, 8);

    setValue(limitPriceInput()!, "35000");
    expect(quoteAmountInput()!.value).toBe("700"); // preserved, not overwritten
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.02, 8); // recalculated
  });

  it("a live MARKET price change preserves the USDT amount the user typed and updates quantity", () => {
    walletData = [
      { currency: "USDT", balance: 10_000, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
    render({ livePrice: 80000 });
    setValue(quoteAmountInput()!, "800");
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.01, 8);

    render({ livePrice: 40000 }); // price ticks down
    expect(quoteAmountInput()!.value).toBe("800"); // preserved
    expect(parseFloat(quantityInput().value)).toBeCloseTo(0.02, 8); // recomputed
  });

  it("a live MARKET price change preserves a directly-typed quantity and updates the USDT estimate", () => {
    walletData = [
      { currency: "USDT", balance: 10_000, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
    render({ livePrice: 80000 });
    setValue(quantityInput(), "0.01");
    expect(parseFloat(quoteAmountInput()!.value)).toBeCloseTo(800, 2);

    render({ livePrice: 40000 });
    expect(quantityInput().value).toBe("0.01"); // preserved
    expect(parseFloat(quoteAmountInput()!.value)).toBeCloseTo(400, 2); // recomputed
  });

  it("the quantity field's unit label matches the selected pair — ETH, not BTC", () => {
    render({ symbol: "ETHUSDT", displayName: "ETH/USDT", livePrice: 2500 });
    expect(container.textContent).toContain("ETH");
    expect(container.textContent).not.toContain("(BTC)");
  });

  it("the quantity field's unit label matches the selected pair — SOL, not BTC", () => {
    render({ symbol: "SOLUSDT", displayName: "SOL/USDT", livePrice: 150 });
    expect(container.textContent).toContain("SOL");
    expect(container.textContent).not.toContain("(BTC)");
  });
});

describe("SpotOrderPanel — BUY slider represents percentage of available USDT", () => {
  beforeEach(() => {
    walletData = [
      { currency: "USDT", balance: 4000, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
  });

  it("25% -> 1,000 USDT", () => {
    render({ livePrice: 80000 });
    setValue(sliderInput(), "25");
    expect(parseFloat(quoteAmountInput()!.value)).toBeCloseTo(1000, 2);
  });

  it("50% -> 2,000 USDT", () => {
    render({ livePrice: 80000 });
    setValue(sliderInput(), "50");
    expect(parseFloat(quoteAmountInput()!.value)).toBeCloseTo(2000, 2);
  });

  it("100% -> 4,000 USDT", () => {
    render({ livePrice: 80000 });
    setValue(sliderInput(), "100");
    expect(parseFloat(quoteAmountInput()!.value)).toBeCloseTo(4000, 2);
  });
});

describe("SpotOrderPanel — a BUY can never submit for more than the available USDT", () => {
  // The Amount (USDT) input clamps itself to the real available balance
  // as the user types (handleQuoteAmountChange), so entering 600 against
  // a 500 USDT balance never reaches the submit handler as 600 at all —
  // it's already 500 by the time Buy is clicked. This is a STRONGER
  // guarantee than a submit-time rejection: the order can never even be
  // built with an over-large amount. The submit-time
  // trading.orderPanel.errors.insufficientUsdt ("Недостаточно USDT")
  // branch in spot-order-panel.tsx remains as defense-in-depth for a
  // quantity that somehow bypasses the input handlers; the backend's own
  // atomic balance check (app/api/spot/orders/route.ts) is what actually
  // guards this regardless of what the UI does.
  it("entering more USDT than available clamps down to the real balance before it can ever be submitted", () => {
    walletData = [
      { currency: "USDT", balance: 500, locked: 0 },
      { currency: "BTC", balance: 0, locked: 0 },
    ];
    render({ livePrice: 1 }); // price=1 so USDT amount == BTC quantity, for a simple assertion
    setValue(quoteAmountInput()!, "600");
    expect(parseFloat(quoteAmountInput()!.value)).toBe(500);

    clickButton("Buy BTC");
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ side: "BUY", quantity: 500 })
    );
  });
});
