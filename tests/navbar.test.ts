// @vitest-environment jsdom
/**
 * Verifies the reworked Navbar right side (Language -> Search -> Deposit
 * -> compact Account icon for an authenticated user; Language -> Search
 * -> Login/Registration for a guest), the compact Account trigger (no
 * name/email/text in the bar), and the new Navbar search dropdown
 * (real Markets data path — no new API/WebSocket).
 *
 * Rendered directly with react-dom/client (no @testing-library/react in
 * this repo) — same low-level approach as the other component tests in
 * this project. Radix DropdownMenu portals its open Content into
 * document.body, so open-dropdown assertions query `document`, not just
 * the local container (which only ever holds the always-rendered bar).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Navbar, type NavbarUser } from "@/components/layout/navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-live-prices", () => ({
  useLivePrices: () => ({ prices: {}, connected: true }),
}));

const MOCK_ASSETS = [
  {
    id: "1",
    symbol: "BTCUSDT",
    displaySymbol: "BTC/USD",
    category: "Cryptocurrencies",
    price: 60000,
    change24h: 1.5,
  },
  {
    id: "2",
    symbol: "ETHUSDT",
    displaySymbol: "ETH/USD",
    category: "Cryptocurrencies",
    price: 3000,
    change24h: -0.5,
  },
];

vi.mock("@/hooks/use-api", () => ({
  useMarkets: () => ({ data: MOCK_ASSETS, isLoading: false }),
}));

const USER: NavbarUser = { firstName: "Demo", lastName: "Trader", email: "demo@gtx.com" };

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderNavbar(user: NavbarUser | null) {
  act(() => {
    root.render(React.createElement(Navbar, { user }));
  });
}

/** Radix's DropdownMenu.Trigger opens on `pointerdown` (button 0), not
 *  `click` — a plain click dispatch never opens it. jsdom in this repo
 *  has no global PointerEvent constructor, but React dispatches by the
 *  event's `type` string, not its class — a MouseEvent typed
 *  "pointerdown" with `button: 0` satisfies Radix's handler the same
 *  way a real PointerEvent would. */
function openDropdown(el: Element | null) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
  });
}

/** React synthesizes onMouseEnter/onMouseLeave from the native
 *  (bubbling) `mouseover`/`mouseout` events, not from `mouseenter`/
 *  `mouseleave` directly (see react-dom's registerDirectEvent calls) —
 *  dispatching the literal enter/leave events is silently ignored. */
function mouseEnter(el: Element | null) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  });
}

function mouseLeave(el: Element | null) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  });
}

/** The dropdown Content is `forceMount`ed (kept in the DOM at all times so
 *  its open/close transition can animate instead of jumping on
 *  mount/unmount), so `document.body.textContent` now always contains the
 *  menu's text regardless of visibility — the open/closed state has to be
 *  read from the `data-state` attribute Radix toggles on the menu node. */
function menuState(): string | null {
  return document.querySelector('[role="menu"]')?.getAttribute("data-state") ?? null;
}

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("Navbar — authenticated user, right-side order", () => {
  it("shows Language", () => {
    renderNavbar(USER);
    expect(container.textContent).toContain("EN");
  });

  it("shows the Search button", () => {
    renderNavbar(USER);
    expect(
      container.querySelector('button[aria-label="Search cryptocurrencies"]')
    ).not.toBeNull();
  });

  it("shows Deposit", () => {
    renderNavbar(USER);
    expect(container.querySelector('a[href="/deposit"]')).not.toBeNull();
  });

  it("shows Profile only as a compact icon button — no name/email/chevron in the bar", () => {
    renderNavbar(USER);
    const accountButton = container.querySelector('button[aria-label="Account menu"]');
    expect(accountButton).not.toBeNull();
    expect(accountButton!.textContent).toBe("");
  });

  it("never shows the text 'Demo Trader' anywhere in the closed bar", () => {
    renderNavbar(USER);
    expect(container.textContent).not.toContain("Demo");
    expect(container.textContent).not.toContain("Trader");
  });

  it("keeps Deposit before Profile, both after Search, both after Language, in DOM order", () => {
    renderNavbar(USER);
    const bar = container.querySelector("header > div") as HTMLElement;
    const html = bar.innerHTML;
    const enIndex = html.indexOf(">EN<");
    const searchIndex = html.indexOf('aria-label="Search cryptocurrencies"');
    const depositIndex = html.indexOf('href="/deposit"');
    const accountIndex = html.indexOf('aria-label="Account menu"');
    expect(enIndex).toBeGreaterThan(-1);
    expect(enIndex).toBeLessThan(searchIndex);
    expect(searchIndex).toBeLessThan(depositIndex);
    expect(depositIndex).toBeLessThan(accountIndex);
  });
});

describe("Navbar — Account dropdown", () => {
  it("opens on click", () => {
    renderNavbar(USER);
    openDropdown(container.querySelector('button[aria-label="Account menu"]'));
    expect(menuState()).toBe("open");
    expect(document.body.textContent).toContain("Log out");
  });

  it("contains every existing account link plus Log out", () => {
    renderNavbar(USER);
    openDropdown(container.querySelector('button[aria-label="Account menu"]'));
    expect(menuState()).toBe("open");
    const labels = [
      "Account",
      "Deposit",
      "Withdrawal",
      "History",
      "Verification",
      "Downloads",
      "Settings",
      "Support",
      "Log out",
    ];
    for (const label of labels) {
      expect(document.body.textContent).toContain(label);
    }
  });

  it("still shows the user's name/email inside the open dropdown (just not in the bar)", () => {
    renderNavbar(USER);
    openDropdown(container.querySelector('button[aria-label="Account menu"]'));
    expect(document.body.textContent).toContain("Demo Trader");
    expect(document.body.textContent).toContain("demo@gtx.com");
  });
});

describe("Navbar — Account dropdown opens on hover, with a bridge to the portaled content", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dropdown content is mounted up front (forceMount) and only toggles data-state + the animated visibility classes — never remounted", () => {
    renderNavbar(USER);
    const trigger = container.querySelector('button[aria-label="Account menu"]');
    const content = document.querySelector('[role="menu"]');
    expect(content).not.toBeNull();
    expect(content!.getAttribute("data-state")).toBe("closed");
    expect(content!.className).toContain("data-[state=closed]:opacity-0");
    expect(content!.className).toContain("data-[state=closed]:pointer-events-none");
    expect(content!.className).toContain("transition");

    mouseEnter(trigger);

    const sameContent = document.querySelector('[role="menu"]');
    expect(sameContent).toBe(content); // same DOM node — no unmount/remount jump
    expect(sameContent!.getAttribute("data-state")).toBe("open");
  });

  it("hovering the trigger opens the dropdown", () => {
    renderNavbar(USER);
    mouseEnter(container.querySelector('button[aria-label="Account menu"]'));
    expect(menuState()).toBe("open");
    expect(document.body.textContent).toContain("Log out");
  });

  it("moving the cursor from the trigger to the dropdown within the grace period keeps it open", () => {
    renderNavbar(USER);
    const trigger = container.querySelector('button[aria-label="Account menu"]');
    mouseEnter(trigger);
    mouseLeave(trigger); // schedules a close
    const content = document.querySelector('[role="menu"]');
    mouseEnter(content); // reaches the dropdown before the close fires -> cancels it
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(menuState()).toBe("open");
  });

  it("leaving both the trigger and the dropdown closes it", () => {
    renderNavbar(USER);
    const trigger = container.querySelector('button[aria-label="Account menu"]');
    mouseEnter(trigger);
    expect(menuState()).toBe("open");
    mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(menuState()).toBe("closed");
  });

  it("a dropdown item stays clickable while the menu is open via hover", () => {
    renderNavbar(USER);
    mouseEnter(container.querySelector('button[aria-label="Account menu"]'));
    // Scoped to the portaled menu — a plain `a[href="/account"]` would
    // also match the Logo link (logoHref is "/account" for a logged-in
    // user), which isn't the dropdown item this test is about.
    const accountLink = document.querySelector('[role="menu"] a[href="/account"]');
    expect(accountLink).not.toBeNull();
    expect(accountLink!.textContent).toContain("Account");
  });

  it("click still opens the dropdown too (hover is additive, not a replacement)", () => {
    renderNavbar(USER);
    openDropdown(container.querySelector('button[aria-label="Account menu"]'));
    expect(menuState()).toBe("open");
  });
});

describe("Navbar — Search dropdown", () => {
  it("opens on click", () => {
    renderNavbar(USER);
    openDropdown(container.querySelector('button[aria-label="Search cryptocurrencies"]'));
    expect(
      document.querySelector('input[placeholder="Search cryptocurrencies"]')
    ).not.toBeNull();
  });

  it("searching BTC shows Bitcoin, and clicking it links to /trading?symbol=BTCUSDT", () => {
    renderNavbar(USER);
    openDropdown(container.querySelector('button[aria-label="Search cryptocurrencies"]'));
    const input = document.querySelector(
      'input[placeholder="Search cryptocurrencies"]'
    ) as HTMLInputElement;
    typeInto(input, "BTC");

    expect(document.body.textContent).toContain("Bitcoin");
    expect(document.body.textContent).not.toContain("Ethereum");

    const link = document.querySelector('a[href="/trading?symbol=BTCUSDT"]');
    expect(link).not.toBeNull();
  });

  it("searching by display symbol also matches", () => {
    renderNavbar(USER);
    openDropdown(container.querySelector('button[aria-label="Search cryptocurrencies"]'));
    const input = document.querySelector(
      'input[placeholder="Search cryptocurrencies"]'
    ) as HTMLInputElement;
    typeInto(input, "ETH/USD");
    expect(document.querySelector('a[href="/trading?symbol=ETHUSDT"]')).not.toBeNull();
  });
});

describe("Navbar — guest", () => {
  it("does not show Deposit", () => {
    renderNavbar(null);
    expect(container.querySelector('a[href="/deposit"]')).toBeNull();
  });

  it("does not show the Account/Profile icon", () => {
    renderNavbar(null);
    expect(container.querySelector('button[aria-label="Account menu"]')).toBeNull();
  });

  it("still shows Language and Search", () => {
    renderNavbar(null);
    expect(container.textContent).toContain("EN");
    expect(
      container.querySelector('button[aria-label="Search cryptocurrencies"]')
    ).not.toBeNull();
  });

  it("shows the existing Login/Registration instead", () => {
    renderNavbar(null);
    expect(container.querySelector('a[href="/login"]')).not.toBeNull();
    expect(container.querySelector('a[href="/register"]')).not.toBeNull();
  });

  it("does not show Wallet in the main navigation", () => {
    renderNavbar(null);
    expect(container.querySelector('nav a[href="/wallet"]')).toBeNull();
  });
});

describe("Navbar — main navigation links unchanged", () => {
  it("keeps Trading/Markets/About us/Tariffs/Contacts", () => {
    renderNavbar(USER);
    const hrefs = ["/trading", "/markets", "/about", "/tariffs", "/contacts"];
    for (const href of hrefs) {
      expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
  });
});

describe("Navbar — Wallet link", () => {
  it("shows Wallet immediately before Trading for an authenticated user", () => {
    renderNavbar(USER);
    const nav = container.querySelector("nav") as HTMLElement;
    const html = nav.innerHTML;
    const walletIndex = html.indexOf('href="/wallet"');
    const tradingIndex = html.indexOf('href="/trading"');
    expect(walletIndex).toBeGreaterThan(-1);
    expect(walletIndex).toBeLessThan(tradingIndex);
  });

  it("does not show Wallet for a guest", () => {
    renderNavbar(null);
    const nav = container.querySelector("nav") as HTMLElement;
    expect(nav.innerHTML.includes('href="/wallet"')).toBe(false);
  });
});
