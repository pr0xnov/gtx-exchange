// @vitest-environment jsdom
/**
 * Footer — description and bottom copyright line were rewritten to drop
 * the old paper-trading/educational-platform framing and the
 * TradingView credit line. Awaited directly, same reasoning as
 * tests/stats-strip.test.ts (async Server Component, no async children).
 */
import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { translate } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { Footer } from "@/components/marketing/footer";

let currentLocale: Locale = "uk";

vi.mock("@/lib/i18n/get-locale", () => ({
  getServerTranslator: () =>
    Promise.resolve((key: Parameters<typeof translate>[1]) =>
      translate(currentLocale, key)
    ),
}));

async function renderFooter() {
  const element = await Footer();
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return { container, root };
}

describe.each([
  ["uk" as Locale, "Усі права захищені", "Симулятор"],
  ["ru" as Locale, "Все права защищены", "Симулятор"],
])("Footer — %s", (locale, rightsReserved, oldWord) => {
  it("shows the new description and the '© <year> GTX · rights-reserved' line, with the old text gone", async () => {
    currentLocale = locale;
    const { container, root } = await renderFooter();

    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    expect(container.textContent).toContain(t("marketing.footer.description"));

    const year = new Date().getFullYear();
    const legalRow = container.querySelector(".border-t.border-border.py-6 p")!;
    expect(legalRow.textContent).toBe(`© ${year} GTX · ${rightsReserved}`);

    expect(container.textContent).not.toContain(oldWord);
    expect(container.textContent).not.toContain("TradingView");
    expect(container.textContent).not.toContain("Lightweight Charts");

    act(() => root.unmount());
    container.remove();
  });
});

describe("Footer — centered brand + single evenly-spaced nav row", () => {
  it("centers the logo and description above one flat nav row (no more separate Platform/Company columns)", async () => {
    currentLocale = "uk";
    const { container, root } = await renderFooter();

    const brandWrapper = container.querySelector(
      ".flex.flex-col.items-center.text-center"
    )!;
    expect(brandWrapper.querySelector("svg")).not.toBeNull(); // Logo
    expect(brandWrapper.textContent).toContain(
      translate("uk", "marketing.footer.description")
    );

    act(() => root.unmount());
    container.remove();
  });

  it("has every public nav destination exactly once, with Support/Contacts collapsed into a single /contacts link", async () => {
    currentLocale = "uk";
    const { container, root } = await renderFooter();

    const expectedHrefs = [
      "/trading",
      "/markets",
      "/about",
      "/analytics",
      "/bonuses",
      "/contacts",
      "/privacy",
    ];
    for (const href of expectedHrefs) {
      const matches = container.querySelectorAll(`a[href="${href}"]`);
      expect(matches.length).toBe(1);
    }

    // The old page is gone — nothing in the footer should still link there.
    expect(container.querySelector('a[href="/support"]')).toBeNull();
    // Terms of Service was dropped from the footer entirely (the /terms
    // route itself is untouched, just no longer linked from here).
    expect(container.querySelector('a[href="/terms"]')).toBeNull();

    act(() => root.unmount());
    container.remove();
  });

  it("places Privacy Policy in the main content area, directly after the nav row and above the bottom separator — never in a bottom-left/right split", async () => {
    currentLocale = "uk";
    const { container, root } = await renderFooter();

    const nav = container.querySelector("nav")!;
    const privacyLink = container.querySelector('a[href="/privacy"]')!;
    const bottomRow = container.querySelector(".border-t.border-border.py-6")!;

    // DOM order: nav comes before the privacy link...
    expect(
      nav.compareDocumentPosition(privacyLink) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    // ...and the privacy link is not inside the bottom copyright row.
    expect(bottomRow.contains(privacyLink)).toBe(false);

    // The bottom row contains only the centered copyright text — no
    // left-column/right-column split, no legal links alongside it.
    expect(bottomRow.querySelectorAll("a").length).toBe(0);
    expect(bottomRow.className).not.toContain("justify-between");

    act(() => root.unmount());
    container.remove();
  });
});
