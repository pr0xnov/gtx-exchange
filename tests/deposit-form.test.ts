// @vitest-environment jsdom
/**
 * Integration test for components/dashboard/deposit-form.tsx — the
 * network-selection flow (spec section 8: the address/QR block stays
 * hidden until a real network is picked) and the new confirmation-modal
 * flow (spec section 4): clicking "Пополнить счёт" never creates a
 * deposit by itself anymore — it only validates network+amount and
 * opens DepositProofModal, the one place that actually submits the
 * request (covered separately in tests/deposit-proof-modal.test.ts).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { DepositForm } from "@/components/dashboard/deposit-form";
import { USDT_NETWORKS } from "@/lib/deposit/usdt-networks";

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
  },
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,fake") },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  toastError.mockClear();
  toastSuccess.mockClear();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          LocaleProvider,
          { initialLocale: "en" },
          React.createElement(DepositForm)
        )
      )
    );
  });
}

function selectNetwork(code: string) {
  const select = container.querySelector("select")!;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLSelectElement.prototype,
    "value"
  )!.set!;
  act(() => {
    setter.call(select, code);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function setAmount(value: string) {
  const input = container.querySelector('input[type="number"]') as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function submit() {
  const form = container.querySelector("form")!;
  act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}

describe("Test 21 — default amount", () => {
  it("Amount defaults to 250 on first open", () => {
    render();
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input.value).toBe("250");
    expect(container.textContent).toContain("250.00 USDT");
  });
});

describe("Section 8 — address block hidden until a network is chosen", () => {
  it("shows no address/QR card before any network is selected", () => {
    render();
    expect(container.querySelector("select")).not.toBeNull();
    expect(container.textContent).not.toContain(USDT_NETWORKS.BSC.address);
    expect(container.textContent).not.toContain(USDT_NETWORKS.TRX.address);
    expect(container.textContent).not.toContain(USDT_NETWORKS.ETH.address);
  });

  it("reveals the matching address/QR card immediately after selecting BSC", async () => {
    render();
    selectNetwork("BSC");
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain(USDT_NETWORKS.BSC.address);
  });

  it("switching network updates the shown address with no stale leftover", async () => {
    render();
    selectNetwork("BSC");
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain(USDT_NETWORKS.BSC.address);

    selectNetwork("TRX");
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain(USDT_NETWORKS.TRX.address);
    expect(container.textContent).not.toContain(USDT_NETWORKS.BSC.address);
  });
});

describe("Submit validation — before any proof modal opens", () => {
  it("blocks and shows an error when no network is selected — no modal opens", async () => {
    render();
    setAmount("1000");
    await act(async () => {
      submit();
      await Promise.resolve();
    });
    expect(toastError).toHaveBeenCalled();
    expect(container.textContent).not.toContain("Payment confirmation");
  });

  it("blocks below the 250 minimum even with a network selected", async () => {
    render();
    selectNetwork("BSC");
    setAmount("100");
    await act(async () => {
      submit();
      await Promise.resolve();
    });
    expect(toastError).toHaveBeenCalled();
  });
});

describe("Section 4 — clicking Submit opens the confirmation modal instead of creating a deposit", () => {
  it("opens 'Payment confirmation' once network+amount are valid", async () => {
    render();
    selectNetwork("TRX");
    setAmount("1000");
    await act(async () => {
      submit();
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Payment confirmation");
    expect(container.textContent).toContain(
      "Attach a screenshot of your transfer so we can confirm your deposit."
    );
  });
});
