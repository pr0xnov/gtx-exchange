// @vitest-environment jsdom
/**
 * Homepage (`/`) redesign — the one piece of real logic is the primary
 * CTA's destination (guest -> /register, authenticated -> /deposit);
 * everything else is static marketing content. HomePage is an async
 * Server Component, so it's awaited directly (a plain async function
 * call, same as Next.js does internally) rather than mounted.
 *
 * StatsStrip/ReferralBlock/Footer are themselves async Server
 * Components — plain ReactDOM (createRoot, used here since this repo has
 * no @testing-library/react) cannot resolve a nested async component the
 * way Next's own RSC renderer does, so they're stubbed with a
 * synchronous marker for this file; their own content is covered by
 * tests/stats-strip.test.ts and tests/referral-block.test.ts, and
 * Footer is pre-existing/untouched so isn't retested here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { translate } from "@/lib/i18n/dictionaries";
import HomePage from "@/app/(marketing)/page";

const LOCALE = "uk" as const;
let mockUser: { id: string; firstName: string; lastName: string; email: string } | null =
  null;

vi.mock("@/lib/auth/session", () => ({
  getOptionalUser: () => Promise.resolve(mockUser),
}));

vi.mock("@/lib/i18n/get-locale", () => ({
  getServerTranslator: () =>
    Promise.resolve((key: Parameters<typeof translate>[1]) => translate(LOCALE, key)),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-live-prices", () => ({
  useLivePrices: () => ({ prices: {}, connected: true }),
}));

vi.mock("@/hooks/use-api", () => ({
  useMarkets: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/components/marketing/stats-strip", () => ({
  StatsStrip: () => React.createElement("div", { "data-testid": "stats-strip" }),
}));

vi.mock("@/components/marketing/referral-block", () => ({
  ReferralBlock: () => React.createElement("div", { "data-testid": "referral-block" }),
}));

vi.mock("@/components/marketing/footer", () => ({
  Footer: () => React.createElement("footer", { "data-testid": "footer" }),
}));

function t(key: Parameters<typeof translate>[1]) {
  return translate(LOCALE, key);
}

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  mockUser = null;
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderHome() {
  const element = await HomePage();
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(LocaleProvider, { initialLocale: LOCALE }, element)
      )
    );
  });
}

describe("Homepage hero", () => {
  it("shows the +20% badge, the new heading, and the green-highlighted portion", async () => {
    await renderHome();
    expect(container.textContent).toContain(t("marketing.home.hero.badge"));
    expect(container.textContent).toContain(t("marketing.home.hero.titleLine1"));
    const highlight = container.querySelector("h1 span") as HTMLElement | null;
    expect(highlight).not.toBeNull();
    expect(highlight!.textContent).toBe(t("marketing.home.hero.titleHighlight"));
  });

  it("shows the hero description and both CTAs", async () => {
    await renderHome();
    expect(container.textContent).toContain(t("marketing.home.hero.subtitle"));
    expect(container.textContent).toContain(t("marketing.home.hero.primaryCta"));
    expect(container.textContent).toContain(t("marketing.home.hero.viewMarkets"));
    expect(container.querySelector('a[href="/markets"]')).not.toBeNull();
  });
});

describe("Homepage — primary CTA routing", () => {
  it("guest: primary CTA links to /register", async () => {
    mockUser = null;
    await renderHome();
    const link = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent === t("marketing.home.hero.primaryCta")
    );
    expect(link?.getAttribute("href")).toBe("/register");
  });

  it("authenticated: primary CTA links to /deposit", async () => {
    mockUser = { id: "u1", firstName: "Demo", lastName: "Trader", email: "demo@gtx.com" };
    await renderHome();
    const link = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent === t("marketing.home.hero.primaryCta")
    );
    expect(link?.getAttribute("href")).toBe("/deposit");
  });
});

describe("Homepage benefits row", () => {
  it("shows all four benefits", async () => {
    await renderHome();
    expect(container.textContent).toContain(t("marketing.home.benefits.security.title"));
    expect(container.textContent).toContain(t("marketing.home.benefits.instant.title"));
    expect(container.textContent).toContain(t("marketing.home.benefits.fees.title"));
    expect(container.textContent).toContain(t("marketing.home.benefits.support.title"));
  });
});

describe("Homepage — section order", () => {
  it("renders Hero, then Stats, then Referral, then Benefits, then Footer, in that order", async () => {
    await renderHome();
    const html = container.innerHTML;
    const heroIndex = html.indexOf(t("marketing.home.hero.badge"));
    const statsIndex = html.indexOf('data-testid="stats-strip"');
    const referralIndex = html.indexOf('data-testid="referral-block"');
    const benefitsIndex = html.indexOf(t("marketing.home.benefits.security.title"));
    const footerIndex = html.indexOf('data-testid="footer"');
    expect(heroIndex).toBeGreaterThan(-1);
    expect(heroIndex).toBeLessThan(statsIndex);
    expect(statsIndex).toBeLessThan(referralIndex);
    expect(referralIndex).toBeLessThan(benefitsIndex);
    expect(benefitsIndex).toBeLessThan(footerIndex);
  });
});

describe("Homepage — old marketing copy is gone", () => {
  it("never mentions leverage/paper-trading/virtual-balance marketing language", async () => {
    await renderHome();
    const text = container.textContent ?? "";
    expect(text).not.toContain("1:100");
    expect(text).not.toContain("10 000");
    expect(text.toLowerCase()).not.toContain("virtual");
    expect(text).not.toContain("навчальна торгівля");
    expect(text).not.toContain("віртуальн");
  });
});
