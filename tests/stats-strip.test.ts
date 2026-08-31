// @vitest-environment jsdom
/**
 * StatsStrip — the 4-stat block directly under the homepage hero.
 * Awaited directly (it's an async Server Component with no async
 * children of its own, unlike the page that composes it — see
 * tests/homepage.test.ts for why that one stubs this component out).
 */
import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { translate } from "@/lib/i18n/dictionaries";
import { StatsStrip } from "@/components/marketing/stats-strip";

const LOCALE = "uk" as const;

vi.mock("@/lib/i18n/get-locale", () => ({
  getServerTranslator: () =>
    Promise.resolve((key: Parameters<typeof translate>[1]) => translate(LOCALE, key)),
}));

function t(key: Parameters<typeof translate>[1]) {
  return translate(LOCALE, key);
}

describe("StatsStrip", () => {
  it("shows all four stats, including the USDT-denominated referral one (not $)", async () => {
    const element = await StatsStrip();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(element));

    expect(container.textContent).toContain(t("marketing.home.stats.bonus.value"));
    expect(container.textContent).toContain(t("marketing.home.stats.bonus.label"));
    expect(container.textContent).toContain(t("marketing.home.stats.assets.value"));
    expect(container.textContent).toContain(t("marketing.home.stats.uptime.value"));
    expect(container.textContent).toContain(t("marketing.home.stats.referral.value"));
    expect(container.textContent).toContain(t("marketing.home.stats.referral.sublabel"));
    expect(container.textContent).toContain("USDT");
    expect(container.textContent).not.toContain("$100");

    act(() => root.unmount());
    container.remove();
  });
});
