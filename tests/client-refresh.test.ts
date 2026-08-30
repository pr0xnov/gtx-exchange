// @vitest-environment jsdom
/**
 * refreshAccessToken() (lib/auth/client-refresh.ts) is the "no refresh
 * storm" guard for hooks/use-api.ts and hooks/use-admin-api.ts's
 * fetchJson: if several API calls 401 around the same moment, they must
 * all share one POST /api/auth/refresh instead of each firing their own
 * (a second concurrent call would present a refresh token the first
 * already rotated/revoked, and get a spurious 401 back).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshAccessToken } from "@/lib/auth/client-refresh";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(() => Promise.resolve({ ok: true } as Response));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("refreshAccessToken — concurrent callers share one request", () => {
  it("fires exactly one POST /api/auth/refresh for 5 concurrent calls", async () => {
    const results = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/refresh", { method: "POST" });
    expect(results).toEqual([true, true, true, true, true]);
  });

  it("fires a new request for a later call, once the previous one has settled", async () => {
    await refreshAccessToken();
    await refreshAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("resolves false (not throw) when the network call itself fails", async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("network down")));
    const ok = await refreshAccessToken();
    expect(ok).toBe(false);
  });

  it("resolves false when the server rejects the refresh (e.g. expired refresh token)", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve({ ok: false } as Response));
    const ok = await refreshAccessToken();
    expect(ok).toBe(false);
  });
});
