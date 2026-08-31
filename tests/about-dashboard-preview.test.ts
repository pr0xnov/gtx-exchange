// @vitest-environment jsdom
/**
 * AboutDashboardPreview — the fake GTX dashboard mockup on /about's
 * "platform visual" section. Purely illustrative marketing content: no
 * user prop, no data fetching, so there is nothing that could leak a
 * real account's balance/orders/assets/PnL. Awaited directly, same
 * reasoning as tests/stats-strip.test.ts.
 */
import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { translate } from "@/lib/i18n/dictionaries";
import { AboutDashboardPreview } from "@/components/marketing/about-dashboard-preview";

const LOCALE = "uk" as const;

vi.mock("@/lib/i18n/get-locale", () => ({
  getServerTranslator: () =>
    Promise.resolve((key: Parameters<typeof translate>[1]) => translate(LOCALE, key)),
}));

function t(key: Parameters<typeof translate>[1]) {
  return translate(LOCALE, key);
}

describe("AboutDashboardPreview", () => {
  it("shows the four illustrative metrics and the BTC/ETH/SOL asset rows", async () => {
    const element = await AboutDashboardPreview();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(element));

    expect(container.textContent).toContain(
      t("marketing.about.platform.availableBalance")
    );
    expect(container.textContent).toContain("5,240.80 USDT");
    expect(container.textContent).toContain(t("marketing.about.platform.inOrders"));
    expect(container.textContent).toContain("1,250.00 USDT");
    expect(container.textContent).toContain(t("marketing.about.platform.assetsValue"));
    expect(container.textContent).toContain("8,490.32 USDT");
    expect(container.textContent).toContain(t("marketing.about.platform.pnl"));
    expect(container.textContent).toContain("+342.16 USDT");

    expect(container.textContent).toContain("BTC/USDT");
    expect(container.textContent).toContain("ETH/USDT");
    expect(container.textContent).toContain("SOL/USDT");
    expect(container.textContent).toContain("+2.45%");
    expect(container.textContent).toContain("-1.12%");

    act(() => root.unmount());
    container.remove();
  });
});
