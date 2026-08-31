// @vitest-environment jsdom
/**
 * Regression test for the reported bug: a user sees "Balance: 4581 USDT"
 * but a Withdrawal request doesn't go through. Root cause (confirmed live
 * against the real demo@gtx.com account before any code change): the
 * displayed account-summary balance is SpotWallet.balance + .locked
 * (funds reserved by the user's own open Spot limit orders included), but
 * app/api/withdraw/route.ts only ever checks/debits SpotWallet.balance
 * alone — correctly, since locked funds can't be double-spent. This
 * form's own client-side pre-check used the locked-inclusive
 * account-summary total, so it silently let through withdrawal amounts
 * the server would then correctly reject as insufficient, which is
 * exactly what made "Balance shows plenty, withdrawal still fails" look
 * broken. Fixed by switching the pre-check to useSpotWallet()'s own
 * `balance` field (the same available-only figure spot-order-panel.tsx
 * already uses, and the exact number the server enforces).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { WithdrawalForm } from "@/components/dashboard/withdrawal-form";

let mockSpotWallets: { currency: string; balance: number; locked: number }[] = [];
const withdrawMutateAsync = vi.fn().mockResolvedValue({ id: "tx1", status: "PENDING" });

vi.mock("@/hooks/use-api", () => ({
  useWithdraw: () => ({ mutateAsync: withdrawMutateAsync, isPending: false }),
  useSpotWallet: () => ({ data: mockSpotWallets }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() },
}));

// LocaleProvider itself calls useRouter() (for router.refresh() on locale
// change) regardless of what WithdrawalForm uses — needed for every
// render in this file even though WithdrawalForm never touches
// next/navigation itself.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  withdrawMutateAsync.mockClear();
  toastError.mockClear();
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
          React.createElement(WithdrawalForm)
        )
      )
    );
  });
}

function setAmount(value: string) {
  const input = container.querySelector('input[type="number"]') as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setAddress(value: string) {
  const input = container.querySelector('input[type="text"]') as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function addressValue(): string {
  return (container.querySelector('input[type="text"]') as HTMLInputElement).value;
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

function submit() {
  const form = container.querySelector("form")!;
  act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}

describe("Amount has no default — the user must type it themselves", () => {
  it("the amount input is empty on first render, unlike Deposit's 250 default", () => {
    mockSpotWallets = [{ currency: "USDT", balance: 1000, locked: 0 }];
    render();

    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(input.value).toBe("");
    expect(container.textContent).toContain("0.00 USDT");
  });
});

describe("WithdrawalForm — pre-check uses the actual withdrawable (non-locked) balance", () => {
  it("blocks an amount that exceeds available balance even though the account's total (incl. locked) would cover it", async () => {
    // Mirrors the real demo@gtx.com account: balance=328.6, locked=4252.7
    // (total "Balance" shown elsewhere would be ~4581).
    mockSpotWallets = [{ currency: "USDT", balance: 328.6, locked: 4252.7 }];
    render();

    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("4000"); // > available (328.6), but < total (4581.3)
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).not.toHaveBeenCalled();
  });

  it("allows an amount within the actual available balance", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 328.6, locked: 4252.7 }];
    render();

    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("50");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).toHaveBeenCalledWith({
      amount: 50,
      method: "TETHER_USDT",
      network: "TRX",
      destinationAddress: "TXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });
  });

  it("still blocks below the minimum regardless of balance", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 10_000, locked: 0 }];
    render();

    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("10");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).not.toHaveBeenCalled();
  });
});

describe("Test 24 — network is included in the submitted payload", () => {
  it("Available=1000, Network=ETH, Amount=500 -> withdraw called with asset amount/method/network/destinationAddress", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 1000, locked: 0 }];
    render();

    selectNetwork("ETH");
    setAddress("0xXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("500");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).toHaveBeenCalledWith({
      amount: 500,
      method: "TETHER_USDT",
      network: "ETH",
      destinationAddress: "0xXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    });
  });
});

describe("Test 25 — network is required", () => {
  it("Amount=500, Network=none -> blocked with an error, withdraw never called", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 1000, locked: 0 }];
    render();

    setAmount("500");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Select a network");
  });

  it("Network=none, Address=filled -> still blocked with the network error, never the address one", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 1000, locked: 0 }];
    render();

    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("500");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Select a network");
  });
});

describe("Test C — wallet address is required", () => {
  it("Network=TRX, Address=empty, Amount=500 -> blocked, withdraw never called, balance not debited", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 1000, locked: 0 }];
    render();

    selectNetwork("TRX");
    setAmount("500");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Enter wallet address");
  });

  it("an address that is only whitespace is treated as empty", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 1000, locked: 0 }];
    render();

    selectNetwork("TRX");
    setAddress("   ");
    setAmount("500");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Enter wallet address");
  });
});

describe("Test E — changing the network clears whatever address was already typed", () => {
  it("TRX address is cleared after switching to ETH", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 1000, locked: 0 }];
    render();

    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    expect(addressValue()).toBe("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

    selectNetwork("ETH");
    expect(addressValue()).toBe("");
  });
});
