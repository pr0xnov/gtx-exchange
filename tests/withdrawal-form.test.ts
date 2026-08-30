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

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

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

function submit() {
  const form = container.querySelector("form")!;
  act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}

describe("WithdrawalForm — pre-check uses the actual withdrawable (non-locked) balance", () => {
  it("blocks an amount that exceeds available balance even though the account's total (incl. locked) would cover it", async () => {
    // Mirrors the real demo@gtx.com account: balance=328.6, locked=4252.7
    // (total "Balance" shown elsewhere would be ~4581).
    mockSpotWallets = [{ currency: "USDT", balance: 328.6, locked: 4252.7 }];
    render();

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

    setAmount("50");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).toHaveBeenCalledWith({
      amount: 50,
      method: "TETHER_USDT",
    });
  });

  it("still blocks below the minimum regardless of balance", async () => {
    mockSpotWallets = [{ currency: "USDT", balance: 10_000, locked: 0 }];
    render();

    setAmount("10");
    await act(async () => {
      submit();
      await Promise.resolve();
    });

    expect(withdrawMutateAsync).not.toHaveBeenCalled();
  });
});
