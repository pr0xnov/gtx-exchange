// @vitest-environment jsdom
/**
 * useWithdraw()'s success handler must invalidate the exact query keys
 * the balance-displaying UI actually reads (["spot-wallet"] —
 * withdrawal-form.tsx's own balance check, spot-order-panel.tsx;
 * ["account-summary"] — the Wallet page, Trading topbar, dashboard
 * summary cards), not just ["portfolio"]/["user"]/["history"] — otherwise
 * the displayed balance keeps showing the pre-withdrawal amount until the
 * next 5s poll instead of updating immediately. Verified by actually
 * refetching (not just asserting on invalidateQueries call args): a
 * second real request for each query only happens if the mutation's
 * onSuccess genuinely invalidated it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWithdraw, useSpotWallet, useAccountSummary } from "@/hooks/use-api";

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;
let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: body }),
  } as Response;
}

let latestWithdraw: ReturnType<typeof useWithdraw>;

function Harness() {
  latestWithdraw = useWithdraw();
  useSpotWallet();
  useAccountSummary();
  return null;
}

beforeEach(() => {
  fetchMock = vi.fn((url: string) => {
    if (url === "/api/withdraw") {
      return Promise.resolve(jsonResponse({ id: "tx1", status: "PENDING" }));
    }
    if (url === "/api/spot/wallet") {
      return Promise.resolve(
        jsonResponse([{ currency: "USDT", balance: 4531, locked: 0 }])
      );
    }
    if (url === "/api/account/summary") {
      return Promise.resolve(
        jsonResponse({ balance: 4531, equity: 4531, profit: 0, spotAssets: [] })
      );
    }
    return Promise.resolve(jsonResponse({}));
  });
  vi.stubGlobal("fetch", fetchMock);

  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function render() {
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Harness)
      )
    );
  });
}

describe("useWithdraw — invalidates the balance queries the UI actually reads", () => {
  it("refetches spot-wallet and account-summary after a successful withdrawal", async () => {
    render();
    await act(async () => {
      await Promise.resolve();
    });

    const spotWalletCallsBefore = fetchMock.mock.calls.filter(
      (c) => c[0] === "/api/spot/wallet"
    ).length;
    const accountSummaryCallsBefore = fetchMock.mock.calls.filter(
      (c) => c[0] === "/api/account/summary"
    ).length;
    expect(spotWalletCallsBefore).toBeGreaterThan(0);
    expect(accountSummaryCallsBefore).toBeGreaterThan(0);

    await act(async () => {
      await latestWithdraw.mutateAsync({ amount: 50, method: "TETHER_USDT" });
    });

    const spotWalletCallsAfter = fetchMock.mock.calls.filter(
      (c) => c[0] === "/api/spot/wallet"
    ).length;
    const accountSummaryCallsAfter = fetchMock.mock.calls.filter(
      (c) => c[0] === "/api/account/summary"
    ).length;

    // A genuine refetch happened — not just a cache flag flip — proving
    // the invalidation actually reaches these two queries.
    expect(spotWalletCallsAfter).toBeGreaterThan(spotWalletCallsBefore);
    expect(accountSummaryCallsAfter).toBeGreaterThan(accountSummaryCallsBefore);
  });
});
