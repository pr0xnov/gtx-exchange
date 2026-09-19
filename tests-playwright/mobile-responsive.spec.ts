import { test, expect, type Page } from "@playwright/test";

// One-off responsive smoke test for the mobile/responsive refactor task
// (see playwright.config.ts). Public pages only — no test account is
// created for this (per the task's own instruction not to create fake
// accounts just for a test run), so authenticated pages (Trading, Wallet,
// Account, ...) are verified by code-level responsive-class review
// instead, not by this script.
const BREAKPOINTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 440, height: 956 },
  { width: 480, height: 960 },
  { width: 768, height: 1024 },
];

const DESKTOP_BREAKPOINTS = [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const PUBLIC_PAGES = [
  "/",
  "/about",
  "/analytics",
  "/bonuses",
  "/contacts",
  "/privacy",
  "/markets",
  "/login",
  "/register",
  "/forgot-password",
];

async function assertNoHorizontalOverflow(page: Page, path: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(
    overflow.scrollWidth,
    `${path} at viewport ${page.viewportSize()?.width}px: scrollWidth ${overflow.scrollWidth} > clientWidth ${overflow.clientWidth} (horizontal overflow)`
  ).toBeLessThanOrEqual(overflow.clientWidth);
}

for (const bp of BREAKPOINTS) {
  test.describe(`Mobile ${bp.width}x${bp.height}`, () => {
    test.use({ viewport: bp });

    for (const path of PUBLIC_PAGES) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path, { waitUntil: "load" });
        await assertNoHorizontalOverflow(page, path);
      });
    }
  });
}

for (const bp of DESKTOP_BREAKPOINTS) {
  test.describe(`Desktop ${bp.width}x${bp.height}`, () => {
    test.use({ viewport: bp });

    for (const path of ["/", "/markets", "/analytics"]) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path, { waitUntil: "load" });
        await assertNoHorizontalOverflow(page, path);
      });
    }
  });
}

test.describe("Mobile Navbar — repeated open/close does not slow down", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger opens/closes repeatedly without progressive slowdown", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    const hamburger = page.getByRole("button", { name: /toggle menu/i });

    const durations: number[] = [];
    for (let i = 0; i < 8; i++) {
      const start = Date.now();
      await hamburger.click();
      await page.waitForTimeout(50);
      await hamburger.click();
      await page.waitForTimeout(50);
      durations.push(Date.now() - start);
    }

    // Real-browser sanity check for the exact concern the known jsdom/
    // Vitest Navbar slowdown raised: repeated open/close in an actual
    // browser (real ResizeObserver, real event-listener cleanup) should
    // stay roughly flat, not grow test-over-test the way the jsdom run
    // did. Generous 3x threshold — this is a smoke check, not a
    // benchmark.
    const first = durations[0]!;
    const last = durations[durations.length - 1]!;
    expect(
      last,
      `Navbar open/close got slower over repeated toggles in a real browser: first=${first}ms last=${last}ms (durations: ${durations.join(", ")})`
    ).toBeLessThan(first * 3 + 200);
  });
});
