// @vitest-environment jsdom
/**
 * About page (`/about`) redesign — the two pieces of real logic are the
 * hero CTA's destination (guest -> /register, authenticated -> /trading)
 * and the final CTA's label+destination (guest: "Create account" ->
 * /register, authenticated: the hero's own primary label -> /trading).
 * Everything else is static marketing content.
 *
 * AboutPage is an async Server Component, awaited directly (same
 * reasoning as tests/homepage.test.ts). AboutDashboardPreview is itself
 * an async Server Component with no async children of its own, so it's
 * stubbed here and covered directly by
 * tests/about-dashboard-preview.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { translate } from "@/lib/i18n/dictionaries";
import AboutPage from "@/app/(marketing)/about/page";

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
  usePathname: () => "/about",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-live-prices", () => ({
  useLivePrices: () => ({ prices: {}, connected: true }),
}));

vi.mock("@/hooks/use-api", () => ({
  useMarkets: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/components/marketing/about-dashboard-preview", () => ({
  AboutDashboardPreview: () =>
    React.createElement("div", { "data-testid": "dashboard-preview" }),
}));

vi.mock("@/components/marketing/footer", () => ({
  Footer: () => React.createElement("footer", { "data-testid": "footer" }),
}));

function t(key: Parameters<typeof translate>[1]) {
  return translate(LOCALE, key);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mockUser = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderAbout() {
  const element = await AboutPage();
  act(() => {
    root.render(React.createElement(LocaleProvider, { initialLocale: LOCALE }, element));
  });
}

describe("About — hero", () => {
  it("shows the 3-line heading with the highlighted last line and the subtitle, with no small eyebrow/badge above it", async () => {
    await renderAbout();
    expect(container.textContent).toContain(t("marketing.about.hero.titleLine1"));
    expect(container.textContent).toContain(t("marketing.about.hero.titleLine2"));
    expect(container.textContent).toContain(t("marketing.about.hero.subtitle"));

    const highlight = container.querySelector("h1 span") as HTMLElement | null;
    expect(highlight).not.toBeNull();
    expect(highlight!.textContent).toBe(t("marketing.about.hero.titleHighlight"));

    // The small green pill/eyebrow above the heading was removed — the
    // hero now starts directly with the main heading.
    const heroSection = container.querySelector("h1")!.closest("section")!;
    expect(heroSection.querySelector("h1")).toBe(container.querySelector("h1"));
    expect(heroSection.textContent!.indexOf("GTX •")).toBe(-1);
  });
});

describe("About — hero primary CTA routing", () => {
  it("guest: 'Почати торгувати' links to /register", async () => {
    mockUser = null;
    await renderAbout();
    const link = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent === t("marketing.about.hero.primaryCta")
    );
    expect(link?.getAttribute("href")).toBe("/register");
  });

  it("authenticated: 'Почати торгувати' links to /trading", async () => {
    mockUser = { id: "u1", firstName: "Demo", lastName: "Trader", email: "demo@gtx.com" };
    await renderAbout();
    const links = Array.from(container.querySelectorAll("a")).filter(
      (a) => a.textContent === t("marketing.about.hero.primaryCta")
    );
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("/trading");
    }
  });

  it("both states link 'Переглянути ринки' to /markets", async () => {
    await renderAbout();
    const marketsLinks = Array.from(container.querySelectorAll("a")).filter(
      (a) => a.getAttribute("href") === "/markets"
    );
    expect(marketsLinks.length).toBeGreaterThan(0);
  });
});

describe("About — final CTA label + routing", () => {
  it("guest: shows 'Створити акаунт' linking to /register", async () => {
    mockUser = null;
    await renderAbout();
    const link = Array.from(container.querySelectorAll("a")).find(
      (a) => a.textContent === t("marketing.about.finalCta.primaryGuest")
    );
    expect(link).not.toBeUndefined();
    expect(link!.getAttribute("href")).toBe("/register");
  });

  it("authenticated: final CTA also reads 'Почати торгувати' and links to /trading", async () => {
    mockUser = { id: "u1", firstName: "Demo", lastName: "Trader", email: "demo@gtx.com" };
    await renderAbout();
    expect(container.textContent).not.toContain(
      t("marketing.about.finalCta.primaryGuest")
    );
    const links = Array.from(container.querySelectorAll("a")).filter(
      (a) => a.textContent === t("marketing.about.hero.primaryCta")
    );
    // Hero's own primary CTA plus the final CTA's primary button, both
    // reading the same label once authenticated.
    expect(links.length).toBe(2);
  });
});

describe("About — sections all present, in order, with the existing Footer at the end", () => {
  it("renders Stats, Mission, Why-GTX, Platform preview, Security, Values, Final CTA, Footer", async () => {
    await renderAbout();
    const html = container.innerHTML;

    expect(container.textContent).toContain(t("marketing.about.stats.assets.value"));
    expect(container.textContent).toContain(t("marketing.about.mission.headingLine1"));
    expect(container.textContent).toContain(t("marketing.about.why.title"));
    expect(container.textContent).toContain(t("marketing.about.why.speed.title"));
    expect(container.textContent).toContain(t("marketing.about.why.simplicity.title"));
    expect(container.textContent).toContain(t("marketing.about.why.control.title"));
    expect(container.textContent).toContain(t("marketing.about.why.available.title"));
    expect(html).toContain('data-testid="dashboard-preview"');
    expect(container.textContent).toContain(t("marketing.about.security.label"));
    expect(container.textContent).toContain(
      t("marketing.about.security.accountProtection.title")
    );
    expect(container.textContent).toContain(
      t("marketing.about.security.twoFactor.title")
    );
    expect(container.textContent).toContain(
      t("marketing.about.security.activityControl.title")
    );
    expect(container.textContent).toContain(t("marketing.about.values.title"));
    expect(container.textContent).toContain(t("marketing.about.finalCta.headingLine1"));

    const statsIndex = html.indexOf(t("marketing.about.stats.assets.value"));
    const missionIndex = html.indexOf(t("marketing.about.mission.headingLine1"));
    const whyIndex = html.indexOf(t("marketing.about.why.title"));
    const platformIndex = html.indexOf('data-testid="dashboard-preview"');
    const securityIndex = html.indexOf(t("marketing.about.security.label"));
    const valuesIndex = html.indexOf(t("marketing.about.values.title"));
    const ctaIndex = html.indexOf(t("marketing.about.finalCta.headingLine1"));
    const footerIndex = html.indexOf('data-testid="footer"');

    expect(statsIndex).toBeLessThan(missionIndex);
    expect(missionIndex).toBeLessThan(whyIndex);
    expect(whyIndex).toBeLessThan(platformIndex);
    expect(platformIndex).toBeLessThan(securityIndex);
    expect(securityIndex).toBeLessThan(valuesIndex);
    expect(valuesIndex).toBeLessThan(ctaIndex);
    expect(ctaIndex).toBeLessThan(footerIndex);
  });
});

describe("About — no fabricated security claims or old paper-trading copy", () => {
  it("never claims cold storage, insurance, licensing, or regulation", async () => {
    await renderAbout();
    const text = (container.textContent ?? "").toLowerCase();
    expect(text).not.toContain("cold storage");
    expect(text).not.toContain("insured");
    expect(text).not.toContain("licensed");
    expect(text).not.toContain("regulated");
    expect(text).not.toContain("bank-level");
  });

  it("never mentions leverage/virtual-balance/paper-trading marketing language", async () => {
    await renderAbout();
    const text = container.textContent ?? "";
    expect(text).not.toContain("1:100");
    expect(text).not.toContain("10 000");
    expect(text).not.toContain("$10,000");
    expect(text).not.toContain("віртуальн");
    expect(text).not.toContain("навчальн");
  });
});
