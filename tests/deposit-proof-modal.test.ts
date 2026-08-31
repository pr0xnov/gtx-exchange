// @vitest-environment jsdom
/**
 * Component test for components/dashboard/deposit-proof-modal.tsx — the
 * modal is the only thing that actually creates a deposit (spec section
 * 4/8): "Отправить на проверку" is blocked with an inline error when no
 * screenshot is attached, and once one is, it POSTs one multipart
 * request carrying amount/method/network/proof together.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { DepositProofModal } from "@/components/dashboard/deposit-proof-modal";

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a) },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

let fetchMock: ReturnType<typeof vi.fn>;

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;
let onClose: ReturnType<typeof vi.fn>;
let onSuccess: ReturnType<typeof vi.fn>;

beforeEach(() => {
  toastSuccess.mockClear();
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { id: "tx1", status: "PENDING" } }),
  });
  vi.stubGlobal("fetch", fetchMock);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  onClose = vi.fn();
  onSuccess = vi.fn();
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
        React.createElement(
          LocaleProvider,
          { initialLocale: "en" },
          React.createElement(DepositProofModal, {
            network: "TRX",
            amount: 1000,
            onClose,
            onSuccess,
          })
        )
      )
    );
  });
}

function submitButton(): HTMLButtonElement {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === "Submit for review"
  ) as HTMLButtonElement;
}

function attachFile(fileName = "proof.png") {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([new Uint8Array([1, 2, 3])], fileName, { type: "image/png" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
}

function deleteButton(): HTMLButtonElement {
  return container.querySelector(
    'button[aria-label="Remove screenshot"]'
  ) as HTMLButtonElement;
}

describe("Test 23 — no screenshot", () => {
  it("blocks submit with an inline error, never calls fetch", async () => {
    render();
    await act(async () => {
      submitButton().click();
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Attach a screenshot of your transfer.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("Test 22 — deposit proof", () => {
  it("submits one multipart request with amount/method/network/proof once a screenshot is attached", async () => {
    render();
    attachFile();

    await act(async () => {
      submitButton().click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/deposit");
    expect(init.method).toBe("POST");
    const body = init.body as FormData;
    expect(body.get("amount")).toBe("1000");
    expect(body.get("method")).toBe("TETHER_USDT");
    expect(body.get("network")).toBe("TRX");
    expect(body.get("proof")).toBeInstanceOf(File);
    expect((body.get("proof") as File).name).toBe("proof.png");

    expect(onSuccess).toHaveBeenCalled();
    // The deposit is only PENDING at this point (no balance change yet —
    // that happens on Admin Approve), so the toast must say the payment
    // is still being processed, never that it "completed"/funds were
    // credited.
    expect(toastSuccess).toHaveBeenCalledWith("Payment is being processed.", {
      description: "Awaiting confirmation.",
    });
    const toastText = JSON.stringify(toastSuccess.mock.calls[0]).toLowerCase();
    expect(toastText).not.toContain("completed");
    expect(toastText).not.toContain("credited");
    expect(toastText).not.toContain("submitted for review");
  });

  it("shows the server's error message and does not call onSuccess when the request fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: "Screenshot is too large (max 5MB)" }),
    });
    render();
    attachFile();

    await act(async () => {
      submitButton().click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Screenshot is too large (max 5MB)");
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("Modal chrome", () => {
  it("shows the title and both hint lines from the spec", () => {
    render();
    expect(container.textContent).toContain("Payment confirmation");
    expect(container.textContent).toContain(
      "Attach a screenshot of your transfer so we can confirm your deposit."
    );
    expect(container.textContent).toContain(
      "The screenshot should show the amount and transfer status."
    );
  });

  it("calls onClose when the X button is clicked", () => {
    render();
    const closeButton = container.querySelector("button")!;
    act(() => closeButton.click());
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Test A — heading centered, instructions equal weight, green bullets", () => {
  it("centers the heading in its own row, independent of the close button", () => {
    render();
    const heading = Array.from(container.querySelectorAll("h2")).find(
      (h) => h.textContent === "Payment confirmation"
    )!;
    const row = heading.parentElement!;
    expect(row.className).toContain("justify-center");
    // The close button is pulled out of flow so it never fights the
    // heading for centering (spec: "не центрировать весь modal content
    // — только heading").
    const closeButton = row.querySelector("button")!;
    expect(closeButton.className).toContain("absolute");
  });

  it("renders both instruction lines at the same font size/weight, as list items with a bullet each", () => {
    render();
    const items = container.querySelectorAll("li");
    expect(items.length).toBe(2);
    for (const li of Array.from(items)) {
      const textSpan = li.lastElementChild as HTMLElement;
      // Same class list on both <li>s (no small/secondary variant for
      // the second line) — this is what "same size, same weight" means
      // structurally once both lines are list items sharing one <ul>.
      expect(textSpan.className).not.toContain("text-xs");
      const bullet = li.firstElementChild as HTMLElement;
      expect(bullet.className).toContain("rounded-full");
      expect(bullet.className).toContain("bg-primary");
    }
    expect(items[0]!.textContent).toBe(
      "Attach a screenshot of your transfer so we can confirm your deposit."
    );
    expect(items[1]!.textContent).toBe(
      "The screenshot should show the amount and transfer status."
    );
  });
});

describe("Test B — a long filename never leaks into the UI", () => {
  it("shows a fixed 'Screenshot uploaded' label and a delete X, not the raw filename", () => {
    render();
    const longName = "добавь_на_центральный_сундук_с_202606021253.jpeg";
    attachFile(longName);

    expect(container.textContent).not.toContain(longName);
    expect(container.textContent).toContain("Screenshot uploaded");
    expect(deleteButton()).toBeTruthy();
  });
});

describe("Test C — the delete X clears the file and returns to the initial state", () => {
  it("removes the uploaded indicator and shows the upload input again", () => {
    render();
    attachFile();
    expect(container.textContent).toContain("Screenshot uploaded");
    expect(container.querySelector('input[type="file"]')).toBeNull();

    act(() => deleteButton().click());

    expect(container.textContent).not.toContain("Screenshot uploaded");
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });
});

describe("Test D — upload, delete, then submit is blocked exactly like never uploading", () => {
  it("shows the required-screenshot error and never calls fetch", async () => {
    render();
    attachFile();
    act(() => deleteButton().click());

    await act(async () => {
      submitButton().click();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Attach a screenshot of your transfer.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
