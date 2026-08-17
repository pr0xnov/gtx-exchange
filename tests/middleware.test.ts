/**
 * Unit tests for middleware.ts's route protection, focused on /wallet
 * (newly added to PROTECTED_PREFIXES/config.matcher for the Wallet page).
 * No DB, no HTTP server — middleware() is a plain function over a
 * NextRequest, called directly, same construction pattern
 * tests/helpers.ts's jsonRequest() already uses elsewhere in this suite.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("middleware — /wallet", () => {
  it("redirects a guest (no access-token cookie) away from /wallet to /login", () => {
    const req = new NextRequest("http://localhost:3000/wallet");
    const res = middleware(req);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("preserves /wallet as the redirect target so login can send the user back", () => {
    const req = new NextRequest("http://localhost:3000/wallet");
    const res = middleware(req);
    const location = res.headers.get("location")!;
    expect(new URL(location).searchParams.get("redirect")).toBe("/wallet");
  });

  it("lets a request with the access-token cookie through to /wallet", () => {
    const req = new NextRequest("http://localhost:3000/wallet");
    req.cookies.set("gtx_access_token", "some-token-value");
    const res = middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });
});
