// @vitest-environment jsdom
/**
 * Verification Approve/Reject button visibility on
 * app/admin/verification/[userId]/page.tsx — never show the action that
 * already matches the current status: PENDING shows both, VERIFIED
 * (=APPROVED) hides Approve, REJECTED hides Reject. The backend already
 * allows both APPROVED->REJECTED and REJECTED->APPROVED unconditionally
 * (no status guard in PATCH /api/admin/verification/[userId]), so both
 * reverse transitions stay reachable via whichever single button remains.
 *
 * hooks/use-admin-api and hooks/use-api are mocked (this is a pure UI-
 * visibility test, not an API test — that's tests/admin-unread-
 * badges.test.ts and tests/deposit-withdrawal-approval.test.ts).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminVerificationDetailPage from "@/app/admin/verification/[userId]/page";

let mockStatus = "PENDING";

vi.mock("@/hooks/use-admin-api", () => ({
  useAdminVerificationDetail: () => ({
    data: {
      profile: {
        firstName: "Jane",
        lastName: "Doe",
        fullName: "Jane Doe",
        email: "jane@example.com",
        country: "US",
        dateOfBirth: null,
        address: null,
      },
      status: mockStatus,
      documents: [],
    },
    isLoading: false,
  }),
  useDecideVerification: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateVerificationProfile: () => ({ mutateAsync: vi.fn() }),
  useDeleteVerificationDocument: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/use-api", () => ({
  useCurrentUser: () => ({ data: { role: "ADMIN" } }),
}));

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// AdminVerificationDetailPage calls React's use(params) — a raw
// Promise.resolve() (unlike Next.js's own pre-resolved `params` thenable)
// genuinely suspends on first render, so this needs a Suspense boundary
// and an async act() to let the retry happen.
async function render() {
  await act(async () => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          React.Suspense,
          { fallback: null },
          React.createElement(AdminVerificationDetailPage, {
            params: Promise.resolve({ userId: "u1" }),
          })
        )
      )
    );
  });
}

function buttonTexts(): string[] {
  return Array.from(container.querySelectorAll("button")).map(
    (b) => b.textContent?.trim() ?? ""
  );
}

describe("Verification decision buttons — PENDING", () => {
  it("shows both Approve and Reject", async () => {
    mockStatus = "PENDING";
    await render();
    const texts = buttonTexts();
    expect(texts).toContain("Approve");
    expect(texts).toContain("Reject");
  });
});

describe("Verification decision buttons — VERIFIED (approved)", () => {
  it("hides Approve, keeps Reject", async () => {
    mockStatus = "VERIFIED";
    await render();
    const texts = buttonTexts();
    expect(texts).not.toContain("Approve");
    expect(texts).toContain("Reject");
  });
});

describe("Verification decision buttons — REJECTED", () => {
  it("hides Reject, keeps Approve", async () => {
    mockStatus = "REJECTED";
    await render();
    const texts = buttonTexts();
    expect(texts).toContain("Approve");
    expect(texts).not.toContain("Reject");
  });
});

describe("Verification decision buttons — UNVERIFIED (no documents yet)", () => {
  it("shows both, unchanged from before this fix (not a status this task addresses)", async () => {
    mockStatus = "UNVERIFIED";
    await render();
    const texts = buttonTexts();
    expect(texts).toContain("Approve");
    expect(texts).toContain("Reject");
  });
});
