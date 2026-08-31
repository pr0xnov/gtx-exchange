// @vitest-environment jsdom
/**
 * Component tests for components/dashboard/deposit-address-card.tsx —
 * the exact spec scenarios (BSC/TRX/ETH address+QR, and switching
 * between them never leaves a stale address/QR from the previous
 * network). `qrcode` is mocked so the assertion is on the CONTRACT this
 * component owes the library — the exact address string, nothing else
 * — rather than decoding a rendered PNG back to text.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DepositAddressCard } from "@/components/dashboard/deposit-address-card";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { USDT_NETWORKS, type UsdtNetwork } from "@/lib/deposit/usdt-networks";

const toDataURL = vi.fn().mockResolvedValue("data:image/png;base64,fake");
vi.mock("qrcode", () => ({
  default: { toDataURL: (...args: unknown[]) => toDataURL(...args) },
}));

const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

const success = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => success(...args) },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  toDataURL.mockClear();
  writeText.mockClear();
  success.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function withLocale(network: UsdtNetwork) {
  return React.createElement(
    LocaleProvider,
    { initialLocale: "en" },
    React.createElement(DepositAddressCard, { network })
  );
}

async function render(network: UsdtNetwork) {
  await act(async () => {
    root.render(withLocale(network));
    await Promise.resolve();
  });
}

describe("Test 14 — BSC", () => {
  it("shows the exact BSC address and encodes exactly that address into the QR", async () => {
    await render("BSC");
    expect(container.textContent).toContain(USDT_NETWORKS.BSC.address);
    expect(toDataURL).toHaveBeenCalledWith(USDT_NETWORKS.BSC.address, expect.anything());
  });

  it("Copy button copies the full BSC address", async () => {
    await render("BSC");
    const button = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Copy"
    )!;
    await act(async () => {
      button.click();
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(USDT_NETWORKS.BSC.address);
    expect(success).toHaveBeenCalled();
  });
});

describe("Test 15 — TRX", () => {
  it("shows the exact TRX address and encodes exactly that address into the QR", async () => {
    await render("TRX");
    expect(container.textContent).toContain(USDT_NETWORKS.TRX.address);
    expect(toDataURL).toHaveBeenCalledWith(USDT_NETWORKS.TRX.address, expect.anything());
  });
});

describe("Test 16 — ETH", () => {
  it("shows the exact ETH address and encodes exactly that address into the QR", async () => {
    await render("ETH");
    expect(container.textContent).toContain(USDT_NETWORKS.ETH.address);
    expect(toDataURL).toHaveBeenCalledWith(USDT_NETWORKS.ETH.address, expect.anything());
  });
});

describe("Test 17 — switching networks never leaves a stale address/QR", () => {
  it("BSC -> TRX -> ETH each show only their own address, immediately", async () => {
    await render("BSC");
    expect(container.textContent).toContain(USDT_NETWORKS.BSC.address);

    await act(async () => {
      root.render(withLocale("TRX"));
      await Promise.resolve();
    });
    expect(container.textContent).toContain(USDT_NETWORKS.TRX.address);
    expect(container.textContent).not.toContain(USDT_NETWORKS.BSC.address);
    expect(toDataURL).toHaveBeenLastCalledWith(
      USDT_NETWORKS.TRX.address,
      expect.anything()
    );

    await act(async () => {
      root.render(withLocale("ETH"));
      await Promise.resolve();
    });
    expect(container.textContent).toContain(USDT_NETWORKS.ETH.address);
    expect(container.textContent).not.toContain(USDT_NETWORKS.TRX.address);
    expect(toDataURL).toHaveBeenLastCalledWith(
      USDT_NETWORKS.ETH.address,
      expect.anything()
    );
  });
});

describe("Address is never truncated in the DOM", () => {
  it("renders the complete address text, not an ellipsis-shortened version", () => {
    // Guards against a future "..." truncation regression — the full
    // string must be a substring of the card's own text content.
    return render("BSC").then(() => {
      const addressEl = Array.from(container.querySelectorAll("div")).find(
        (el) => el.textContent === USDT_NETWORKS.BSC.address
      );
      expect(addressEl).toBeTruthy();
    });
  });
});
