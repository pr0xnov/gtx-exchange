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
  it("shows the new description and '© <year> GTX' + rights-reserved on two lines, with the old text gone", async () => {
    currentLocale = locale;
    const { container, root } = await renderFooter();

    const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
    expect(container.textContent).toContain(t("marketing.footer.description"));

    const year = new Date().getFullYear();
    const lines = container.querySelectorAll(".border-t.border-border.py-6 p");
    expect(lines.length).toBe(2);
    expect(lines[0]!.textContent).toBe(`© ${year} GTX`);
    expect(lines[1]!.textContent).toBe(rightsReserved);

    expect(container.textContent).not.toContain(oldWord);
    expect(container.textContent).not.toContain("TradingView");
    expect(container.textContent).not.toContain("Lightweight Charts");

    act(() => root.unmount());
    container.remove();
  });
});

describe("Footer — links/columns are unchanged", () => {
  it("still has Platform/Company/Legal columns with all their original links", async () => {
    currentLocale = "uk";
    const { container, root } = await renderFooter();

    const expectedHrefs = [
      "/trading",
      "/markets",
      "/analytics",
      "/about",
      "/contacts",
      "/support",
      "/privacy",
      "/terms",
    ];
    for (const href of expectedHrefs) {
      expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }

    act(() => root.unmount());
    container.remove();
  });
});
