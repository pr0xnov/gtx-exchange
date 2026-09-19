// @vitest-environment jsdom
/**
 * Privacy page (`/privacy`) — new page, built from scratch (there was no
 * existing /privacy route despite Footer already linking to one). Awaited
 * directly, same reasoning as tests/homepage.test.ts / tests/about.test.ts.
 * The one piece of real logic is the support CTA's second button, which
 * only appears for an authenticated user.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { translate } from "@/lib/i18n/dictionaries";
import PrivacyPage, { generateMetadata } from "@/app/(marketing)/privacy/page";

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
  usePathname: () => "/privacy",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-live-prices", () => ({
  useLivePrices: () => ({ prices: {}, connected: true }),
}));

vi.mock("@/hooks/use-api", () => ({
  useMarkets: () => ({ data: [], isLoading: false }),
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

async function renderPrivacy() {
  const element = await PrivacyPage();
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

describe("Privacy — hero", () => {
  it("shows the label, heading, subtitle, tagline, and last-updated line", async () => {
    await renderPrivacy();
    expect(container.textContent).toContain(t("privacy.hero.label"));
    expect(container.textContent).toContain(t("privacy.hero.headingLine1"));
    expect(container.textContent).toContain(t("privacy.hero.headingLine2"));
    expect(container.textContent).toContain(t("privacy.hero.subtitle"));
    expect(container.textContent).toContain(t("privacy.hero.tagline"));
    expect(container.textContent).toContain(t("privacy.hero.lastUpdated"));
  });
});

describe("Privacy — principles", () => {
  it("shows all 5 principle cards", async () => {
    await renderPrivacy();
    expect(container.textContent).toContain(t("privacy.principles.transparency.title"));
    expect(container.textContent).toContain(t("privacy.principles.minimization.title"));
    expect(container.textContent).toContain(t("privacy.principles.accountability.title"));
    expect(container.textContent).toContain(t("privacy.principles.userRights.title"));
    expect(container.textContent).toContain(t("privacy.principles.dataProtection.title"));
  });
});

describe("Privacy — how GTX uses data", () => {
  it("shows personal data examples, all 10 usage items, retention, third parties, and cookie items", async () => {
    await renderPrivacy();
    expect(container.textContent).toContain(t("privacy.usage.personalData.example1"));
    expect(container.textContent).toContain(t("privacy.usage.personalData.example4"));
    for (let i = 1; i <= 10; i++) {
      expect(container.textContent).toContain(
        t(`privacy.usage.howWeUse.item${i}` as Parameters<typeof translate>[1])
      );
    }
    expect(container.textContent).toContain(t("privacy.usage.retention.description"));
    expect(container.textContent).toContain(t("privacy.usage.thirdParties.description"));
    expect(container.textContent).toContain(t("privacy.usage.cookies.item1"));
    expect(container.textContent).toContain(t("privacy.usage.cookies.item4"));
  });
});

describe("Privacy — rights and FAQ accordions", () => {
  it("shows all 7 rights questions", async () => {
    await renderPrivacy();
    expect(container.textContent).toContain(t("privacy.rights.access.question"));
    expect(container.textContent).toContain(t("privacy.rights.rectification.question"));
    expect(container.textContent).toContain(t("privacy.rights.erasure.question"));
    expect(container.textContent).toContain(t("privacy.rights.restriction.question"));
    expect(container.textContent).toContain(t("privacy.rights.objection.question"));
    expect(container.textContent).toContain(t("privacy.rights.withdrawConsent.question"));
    expect(container.textContent).toContain(t("privacy.rights.portability.question"));
  });

  it("shows all 6 FAQ questions and expands an answer on click", async () => {
    await renderPrivacy();
    expect(container.textContent).toContain(t("privacy.faq.q1.question"));
    expect(container.textContent).toContain(t("privacy.faq.q6.question"));

    const button = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === t("privacy.faq.q1.question")
    )!;
    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain(t("privacy.faq.q1.answer"));
  });
});

describe("Privacy — support CTA", () => {
  it("guest sees only the support button, not the account button", async () => {
    mockUser = null;
    await renderPrivacy();
    // Not scoped by href alone — the Navbar's own "Support" nav item (see
    // navbar.tsx) now also points to /contacts since the old /support page
    // was removed, so this looks the CTA up by its actual button text.
    const supportLink = Array.from(
      container.querySelectorAll('a[href="/contacts"]')
    ).find((a) => a.textContent === t("privacy.support.primaryCta"));
    expect(supportLink).not.toBeUndefined();
    expect(container.querySelector('a[href="/account"]')).toBeNull();
  });

  it("authenticated user sees both the support and account buttons", async () => {
    mockUser = { id: "u1", firstName: "Demo", lastName: "Trader", email: "demo@gtx.com" };
    await renderPrivacy();
    const supportLink = Array.from(
      container.querySelectorAll('a[href="/contacts"]')
    ).find((a) => a.textContent === t("privacy.support.primaryCta"));
    expect(supportLink).not.toBeUndefined();
    // Not scoped by href alone — an authenticated Navbar's own logo also
    // links to /account (see navbar.tsx's logoHref), so this looks it up
    // by its actual button text instead.
    const accountLink = Array.from(container.querySelectorAll('a[href="/account"]')).find(
      (a) => a.textContent === t("privacy.support.secondaryCta")
    );
    expect(accountLink).not.toBeUndefined();
  });
});

describe("Privacy — no Binance-style Privacy Notice Dashboard or DPO content", () => {
  it("never mentions a Privacy Notice Dashboard, region selector, or DPO team", async () => {
    await renderPrivacy();
    const text = container.textContent ?? "";
    expect(text).not.toContain("Privacy Notice Dashboard");
    expect(text).not.toContain("DPO");
    expect(text).not.toContain("Data Protection Officer");
    expect(text).not.toContain("APAC");
    expect(text).not.toContain("LATAM");
    expect(text).not.toContain("MENA");
  });

  it("existing Footer is rendered (not a second, Binance-style footer)", async () => {
    await renderPrivacy();
    const footers = container.querySelectorAll("footer");
    expect(footers.length).toBe(1);
    expect(footers[0]!.getAttribute("data-testid")).toBe("footer");
  });
});

describe("Privacy — SEO metadata", () => {
  it("generateMetadata returns the privacy-specific title/description, not the global one", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(t("privacy.seo.title"));
    expect(metadata.description).toBe(t("privacy.seo.description"));
  });
});
