// @vitest-environment jsdom
/**
 * ReferralBlock — the "invite friends" marketing section on the
 * homepage. Awaited directly, same reasoning as tests/stats-strip.test.ts.
 */
import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { translate } from "@/lib/i18n/dictionaries";
import { ReferralBlock } from "@/components/marketing/referral-block";

const LOCALE = "uk" as const;

vi.mock("@/lib/i18n/get-locale", () => ({
  getServerTranslator: () =>
    Promise.resolve((key: Parameters<typeof translate>[1]) => translate(LOCALE, key)),
}));

function t(key: Parameters<typeof translate>[1]) {
  return translate(LOCALE, key);
}

describe("ReferralBlock", () => {
  it("shows the heading, description, and both deposit/receive steps", async () => {
    const element = await ReferralBlock();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(element));

    expect(container.textContent).toContain(t("marketing.home.referral.titleLine1"));
    expect(container.textContent).toContain(t("marketing.home.referral.titleHighlight"));
    expect(container.textContent).toContain(t("marketing.home.referral.description"));
    expect(container.textContent).toContain(t("marketing.home.referral.deposit1Value"));
    expect(container.textContent).toContain(t("marketing.home.referral.receive1Value"));
    expect(container.textContent).toContain(t("marketing.home.referral.deposit2Value"));
    expect(container.textContent).toContain(t("marketing.home.referral.receive2Value"));

    act(() => root.unmount());
    container.remove();
  });

  it("forces the heading onto two lines with only the amount in green", async () => {
    const element = await ReferralBlock();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(element));

    const heading = container.querySelector("h2")!;
    expect(heading.querySelector("br")).not.toBeNull();

    const highlight = heading.querySelector("span")!;
    expect(highlight.textContent).toBe(t("marketing.home.referral.titleHighlight"));
    expect(highlight.className).toContain("text-primary");

    // "отримайте " sits before the <span>, as plain (white) text — not
    // inside the green highlight.
    expect(heading.textContent).toContain(t("marketing.home.referral.titleLine2Prefix"));
    expect(highlight.textContent).not.toContain(
      t("marketing.home.referral.titleLine2Prefix").trim()
    );

    act(() => root.unmount());
    container.remove();
  });
});
