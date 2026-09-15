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

function amountInput(): HTMLInputElement {
  return container.querySelector("#withdrawal-amount") as HTMLInputElement;
}

function addressInput(): HTMLInputElement {
  return container.querySelector("#withdrawal-address") as HTMLInputElement;
}

function setAmount(value: string) {
  const input = amountInput();
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function setAddress(value: string) {
  const input = addressInput();
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
  return addressInput().value;
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

    expect(amountInput().value).toBe("");
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

/**
 * Fix (v2): the amount field must never be able to CONTAIN a value
 * greater than the available balance, not even momentarily with an
 * inline error shown — an out-of-range edit is rejected the same way a
 * malformed one (letters, scientific notation) always was, leaving the
 * field at its last valid value. The MAX button from the previous
 * iteration of this fix is removed entirely. Covers the test matrix this
 * revision was built under, plus the original scientific-notation/huge-
 * paste coverage (D/E/E2), now re-expressed as "rejected outright"
 * rather than "accepted, then flagged".
 */
function submitButton(): HTMLButtonElement {
  return container.querySelector('button[type="submit"]') as HTMLButtonElement;
}

describe("MAX button is removed", () => {
  it("no button labelled MAX exists anywhere in the form", () => {
    mockSpotWallets = [{ currency: "USDT", balance: 28182.5, locked: 0 }];
    render();

    const hasMaxButton = Array.from(container.querySelectorAll("button")).some(
      (b) => b.textContent?.trim() === "MAX"
    );
    expect(hasMaxButton).toBe(false);
  });
});

describe("Amount can never exceed available balance (28182.50 USDT)", () => {
  const AVAILABLE = 28182.5;

  beforeEach(() => {
    mockSpotWallets = [{ currency: "USDT", balance: AVAILABLE, locked: 0 }];
  });

  it("A: 250 is accepted — submit stays enabled once address/network are set", async () => {
    render();
    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("250");

    expect(amountInput().value).toBe("250");
    expect(submitButton().disabled).toBe(false);
  });

  it("B: exactly the available balance (28182.50) is accepted", async () => {
    render();
    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("28182.50");

    expect(amountInput().value).toBe("28182.50");
    expect(submitButton().disabled).toBe(false);
  });

  it("C: one cent over the available balance (28182.51) is rejected outright — field stays empty", async () => {
    render();
    setAmount("28182.51");

    expect(amountInput().value).toBe(""); // never entered the field at all
  });

  it("C2: editing a valid amount to exceed the balance is rejected — the last valid value remains", async () => {
    render();
    setAmount("28182.5"); // the exact spec example: user currently has 28,182.5
    expect(amountInput().value).toBe("28182.5");

    setAmount("281825"); // tries to type another digit, pushing it over balance
    expect(amountInput().value).toBe("28182.5"); // rejected, last valid value kept

    setAmount("28182.55"); // also over balance by 5 cents
    expect(amountInput().value).toBe("28182.5"); // still rejected
  });

  it("submit never fires for a value that would have exceeded balance, since it can't be entered", async () => {
    render();
    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("30000"); // > available — rejected at entry

    expect(amountInput().value).toBe("");
    await act(async () => {
      submit();
      await Promise.resolve();
    });
    expect(withdrawMutateAsync).not.toHaveBeenCalled();
  });

  it("D: pasting a 15-digit value is rejected outright — field stays at its previous value", async () => {
    render();
    setAmount("250");
    expect(amountInput().value).toBe("250");

    setAmount("999999999999999"); // pasted in one go, replacing the field
    expect(amountInput().value).toBe("250"); // rejected, previous value kept
  });

  it("D2: pasting a huge value into an empty field keeps it empty, never converts to MAX", async () => {
    render();
    setAmount("999999999999999");
    expect(amountInput().value).toBe("");
  });

  it("E: '1e25' pasted as a whole is rejected outright — never silently reinterpreted as 125", async () => {
    render();
    setAmount("1e25");
    expect(amountInput().value).toBe(""); // whole paste rejected, field untouched

    setAmount("125"); // sanity: a genuinely valid value still works afterward
    expect(amountInput().value).toBe("125");
  });

  it("E2: typing 'e' mid-entry never sticks — the field bounces back to the last valid value", async () => {
    render();
    setAmount("1");
    expect(amountInput().value).toBe("1");

    setAmount("1e"); // simulates the next keystroke landing on the current field value
    expect(amountInput().value).toBe("1"); // "e" never committed — not "1e", not "125" later
  });

  it("F: a negative amount (-100) is rejected outright — never enters the field", async () => {
    render();
    setAmount("-100");
    expect(amountInput().value).toBe("");
  });

  it("G: zero is a syntactically valid entry but leaves submit disabled (below minimum)", async () => {
    render();
    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("0");

    expect(amountInput().value).toBe("0");
    expect(submitButton().disabled).toBe(true);
  });
});

describe("Backend requests an amount over balance directly — still rejected server-side", () => {
  it("useWithdraw is never called with an amount the frontend allowed to exceed balance", async () => {
    // Belt-and-suspenders: this file only proves the frontend can't be
    // made to submit an over-balance amount. Server-side authoritative
    // rejection itself is covered independently in
    // tests/withdraw-balance-validation.test.ts against the real route
    // and database.
    mockSpotWallets = [{ currency: "USDT", balance: 28182.5, locked: 0 }];
    render();
    selectNetwork("TRX");
    setAddress("TXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    setAmount("30000");

    await act(async () => {
      submit();
      await Promise.resolve();
    });
    expect(withdrawMutateAsync).not.toHaveBeenCalled();
  });
});

describe('"You will receive" never renders scientific notation', () => {
  it("stays at 0.00 USDT even after attempting to paste an absurdly large entry (it never enters the field)", () => {
    mockSpotWallets = [{ currency: "USDT", balance: 28182.5, locked: 0 }];
    render();

    setAmount("9999999999999999999999999");
    expect(container.textContent).not.toContain("1e+");
    expect(container.textContent).not.toMatch(/\de[+-]\d/i);
    expect(container.textContent).toContain("0.00 USDT");
  });

  it("shows 0.00 USDT for an empty/invalid amount", () => {
    mockSpotWallets = [{ currency: "USDT", balance: 28182.5, locked: 0 }];
    render();

    expect(container.textContent).toContain("0.00 USDT");
  });

  it("formats a normal amount with thousands separators and 2 decimals", () => {
    mockSpotWallets = [{ currency: "USDT", balance: 28182.5, locked: 0 }];
    render();

    setAmount("28182.5");
    expect(container.textContent).toContain("28,182.50 USDT");
  });
});
