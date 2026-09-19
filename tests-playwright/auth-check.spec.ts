import { test, expect, type Page } from "@playwright/test";

// One-off authenticated smoke check for the remaining dashboard pages on
// mobile, requested explicitly by the user after the public-pages-only
// automated suite already covered Wallet + Trading. Uses a real account
// already registered against the local dev database (not production) —
// registering fresh from inside this spec was flaky against `next dev`'s
// on-demand route compilation, so account creation is done once, out of
// band, and this file only logs in. Not part of the regular test suite.
const EMAIL = "mobile-check-fixed@example.test";
const PASSWORD = "TestPass123";

const MOBILE_WIDTHS = [
  { width: 375, height: 812, name: "375x812" },
  { width: 390, height: 844, name: "390x844" },
  { width: 768, height: 1024, name: "768x1024" },
];

async function login(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(account|wallet)/, { timeout: 15000 });
}

async function checkNoOverflow(page: Page, path: string, screenshotName: string) {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  await page.screenshot({ path: `test-results/${screenshotName}.png`, fullPage: true });
  expect(
    overflow.scrollWidth,
    `${path}: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`
  ).toBeLessThanOrEqual(overflow.clientWidth);
}

test.describe.serial("Authenticated mobile check — Wallet + Trading", () => {
  for (const bp of MOBILE_WIDTHS) {
    test(`Wallet @ ${bp.name} — no overflow, screenshot`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await login(page);
      await checkNoOverflow(page, "/wallet", `wallet-${bp.name}`);
    });

    test(`Trading @ ${bp.name} — no overflow, chart visible, screenshot`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await login(page);

      await page.goto("/trading", { waitUntil: "load" });
      await page.waitForTimeout(1500);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      // Chart is a <canvas> from lightweight-charts inside the chart wrapper.
      const chartBox = await page.locator("canvas").first().boundingBox();

      await page.screenshot({
        path: `test-results/trading-${bp.name}.png`,
        fullPage: false,
      });

      expect(
        overflow.scrollWidth,
        `Trading @ ${bp.name}: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth}`
      ).toBeLessThanOrEqual(overflow.clientWidth);
      expect(chartBox, `Trading @ ${bp.name}: no visible canvas found`).not.toBeNull();
      if (chartBox) {
        expect(
          chartBox.height,
          `Trading @ ${bp.name}: chart height too small (${chartBox.height}px)`
        ).toBeGreaterThan(100);
      }

      if (bp.width < 1024) {
        // Mobile pair selector bar should be visible; desktop sidebar hidden.
        await expect(page.locator("text=BTC/USDT").first()).toBeVisible();
      }
    });
  }
});

test.describe.serial("Authenticated mobile check — remaining dashboard pages", () => {
  const PAGES: { path: string; name: string }[] = [
    { path: "/account", name: "account" },
    { path: "/deposit", name: "deposit" },
    { path: "/withdrawal", name: "withdrawal" },
    { path: "/history", name: "history" },
    { path: "/verification", name: "verification" },
    { path: "/settings", name: "settings" },
  ];

  for (const bp of MOBILE_WIDTHS) {
    for (const p of PAGES) {
      test(`${p.name} @ ${bp.name} — no overflow, screenshot`, async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await login(page);
        await checkNoOverflow(page, p.path, `${p.name}-${bp.name}`);
      });
    }
  }
});
