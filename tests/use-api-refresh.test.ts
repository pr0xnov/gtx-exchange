// @vitest-environment jsdom
/**
 * Integration coverage for hooks/use-api.ts's fetchJson() retry-once-
 * after-refresh behavior — the client-side half of the automatic
 * access-token-refresh fix (the server-side half is
 * tests/session-refresh.test.ts). refreshAccessToken() itself (the
 * concurrent-lock) is mocked here since its own behavior is already
 * covered by tests/client-refresh.test.ts; this file only checks that
 * fetchJson calls it on a 401 and replays the request exactly once.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-api";

vi.mock("@/lib/auth/client-refresh", () => ({
  refreshAccessToken: vi.fn(),
}));

import { refreshAccessToken } from "@/lib/auth/client-refresh";

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;
let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

let lastResult: { data?: unknown; isError: boolean } = { isError: false };

function Harness() {
  const { data, isError } = useCurrentUser();
  lastResult = { data, isError };
  return null;
}

beforeEach(() => {
  vi.mocked(refreshAccessToken).mockReset();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
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

describe("fetchJson — refresh-and-retry-once on 401", () => {
  it("refreshes once and replays the request when the access token has expired", async () => {
    fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(401, { success: false, error: "Not authenticated" })
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: "u1" } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(refreshAccessToken).mockResolvedValue(true);

    render();
    await act(async () => {
      await vi.waitFor(() => expect(lastResult.data).toBeDefined());
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(lastResult.data).toEqual({ id: "u1" });
  });

  it("does not retry a second time if the replayed request 401s again (refresh token also invalid)", async () => {
    fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(401, { success: false, error: "Not authenticated" })
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(refreshAccessToken).mockResolvedValue(true);

    render();
    await act(async () => {
      await vi.waitFor(() => expect(lastResult.isError).toBe(true));
    });

    // One original request + exactly one retry — never an infinite loop.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it("does not call fetch again at all when refreshAccessToken itself fails", async () => {
    fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(401, { success: false, error: "Not authenticated" })
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(refreshAccessToken).mockResolvedValue(false);

    render();
    await act(async () => {
      await vi.waitFor(() => expect(lastResult.isError).toBe(true));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1); // no pointless replay
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });
});
