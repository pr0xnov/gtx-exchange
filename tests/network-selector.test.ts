// @vitest-environment jsdom
/**
 * Component test for components/dashboard/network-selector.tsx — a
 * native <select> offering exactly the three configured USDT networks,
 * starting unselected (see deposit-form.tsx: the address card only
 * appears once a real network is chosen).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NetworkSelector } from "@/components/dashboard/network-selector";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import type { UsdtNetwork } from "@/lib/deposit/usdt-networks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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

function render(value: UsdtNetwork | "", onChange: (n: UsdtNetwork) => void) {
  act(() => {
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(NetworkSelector, { value, onChange })
      )
    );
  });
}

function select(): HTMLSelectElement {
  return container.querySelector("select")!;
}

describe("NetworkSelector", () => {
  it("offers exactly BSC, TRX, and ETH plus the disabled placeholder", () => {
    render("", () => {});
    const options = Array.from(select().querySelectorAll("option")).map((o) => o.value);
    expect(options).toEqual(["", "BSC", "TRX", "ETH"]);
    expect(select().querySelector('option[value=""]')).toHaveProperty("disabled", true);
  });

  it("shows each network's label and description together", () => {
    render("", () => {});
    expect(container.textContent).toContain("BSC — BNB Smart Chain (BEP20)");
    expect(container.textContent).toContain("TRX — Tron (TRC20)");
    expect(container.textContent).toContain("ETH — Ethereum (ERC20)");
  });

  it("starts unselected when value is empty", () => {
    render("", () => {});
    expect(select().value).toBe("");
  });

  it("calls onChange with the picked network code", () => {
    const onChange = vi.fn();
    render("", onChange);
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value"
      )!.set!;
      setter.call(select(), "TRX");
      select().dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("TRX");
  });

  it("reflects the currently selected network", () => {
    render("ETH", () => {});
    expect(select().value).toBe("ETH");
  });
});
