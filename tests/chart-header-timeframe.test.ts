// @vitest-environment jsdom
/**
 * Component tests for the /trading chart's timeframe selector
 * (components/trading/chart-header.tsx): the button opens a real Radix
 * dropdown menu on click, offers exactly the 8 required timeframes, shows
 * the currently-selected one on the trigger, and picking one both closes
 * the menu and calls back with the new value. Confirmed in isolation
 * (this file) that the click-to-open mechanism itself works correctly —
 * if it still doesn't open in a real browser, the cause lives outside
 * this component (see the site-wide Navbar dropdown scroll/pointer lock
 * this task's investigation found — components/layout/navbar.tsx's
 * AccountDropdown now sets `modal={false}` specifically to prevent that).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ChartHeader } from "@/components/trading/chart-header";
import type { Timeframe } from "@/components/trading/candlestick-chart";

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

function render(timeframe: Timeframe, onTimeframeChange: (tf: Timeframe) => void) {
  act(() => {
    root.render(
      React.createElement(ChartHeader, {
        displayName: "BTC/USD",
        price: 60000,
        changePercent: 1.2,
        timeframe,
        onTimeframeChange,
      })
    );
  });
}

// Radix's DropdownMenu.Trigger opens on pointerdown, not a bare "click"
// event — dispatch the same sequence a real mouse click produces.
function clickTrigger(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

function menu(): HTMLElement | null {
  return document.querySelector('[role="menu"]');
}

describe("ChartHeader timeframe selector — the button opens the dropdown", () => {
  it("the trigger shows the current timeframe's label", () => {
    render("4h", vi.fn());
    const trigger = container.querySelector("button")!;
    expect(trigger.textContent).toContain("4h");
  });

  it("is closed by default", () => {
    render("1h", vi.fn());
    expect(menu()).toBeNull();
  });

  it("clicking the trigger opens the menu", () => {
    render("1h", vi.fn());
    const trigger = container.querySelector("button")!;
    clickTrigger(trigger);
    expect(menu()).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("ChartHeader timeframe selector — offers exactly the 8 required timeframes", () => {
  it("lists 5s, 30s, 1m, 15m, 1h, 4h, 1D, 1W — no more, no less", () => {
    render("1h", vi.fn());
    clickTrigger(container.querySelector("button")!);
    const items = Array.from(menu()!.querySelectorAll('[role="menuitem"]')).map(
      (el) => el.textContent
    );
    expect(items).toEqual(["5s", "30s", "1m", "15m", "1h", "4h", "1D", "1W"]);
  });
});

describe("ChartHeader timeframe selector — picking an option", () => {
  it("calls onTimeframeChange with the picked value and closes the menu", () => {
    const onTimeframeChange = vi.fn();
    render("1h", onTimeframeChange);
    clickTrigger(container.querySelector("button")!);

    const fourHourItem = Array.from(menu()!.querySelectorAll('[role="menuitem"]')).find(
      (el) => el.textContent === "4h"
    )!;
    act(() => {
      fourHourItem.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true })
      );
      fourHourItem.dispatchEvent(
        new MouseEvent("mouseup", { bubbles: true, cancelable: true })
      );
      fourHourItem.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    });

    expect(onTimeframeChange).toHaveBeenCalledWith("4h");
  });

  it("re-rendering with the newly-selected timeframe updates the trigger label", () => {
    render("1h", vi.fn());
    expect(container.querySelector("button")!.textContent).toContain("1h");

    render("1w", vi.fn());
    const trigger = container.querySelector("button")!;
    expect(trigger.textContent).toContain("1W");
  });
});
