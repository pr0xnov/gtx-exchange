import { test, expect, type Page } from "@playwright/test";

// One-off real-browser E2E check for a reported bug: "Settings > Security
// > Change Password shows a success toast but the password doesn't
// actually change." A prior investigation (code review + direct HTTP
// calls against the running app) could not reproduce it — this spec
// drives an actual Chromium browser through the real UI (click-by-click,
// not curl/fetch) against the same running dev container, to rule out a
// browser/React-specific cause the HTTP-level check couldn't see:
// double submit, stale form state, a false-positive toast, a console
// error masked by the UI, etc. Not part of the regular suite — run
// explicitly with `npx playwright test tests-playwright/change-password-e2e.spec.ts`.
test.use({ baseURL: "http://localhost:3000" });

const EMAIL = `pw-e2e-${Date.now()}@example.test`;
const OLD_PASSWORD = "OldPass123!";
const NEW_PASSWORD = "NewPass456!";
const NEWER_PASSWORD = "NewerPass789!";

async function login(page: Page, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').click();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).hover();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.waitForURL(/\/(login)?$/, { timeout: 10000 });
}

async function goToSettingsViaUi(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).hover();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await page.waitForURL(/\/settings/, { timeout: 10000 });
}

async function changePasswordViaUi(
  page: Page,
  current: string,
  next: string
): Promise<{ status: number; requestBody: unknown; responseBody: unknown }> {
  await page.locator("#currentPassword").fill(current);
  await page.locator("#newPassword").fill(next);
  await page.locator("#confirmPassword").fill(next);

  const [req] = await Promise.all([
    page.waitForRequest(
      (r) => r.url().includes("/api/settings/password") && r.method() === "POST"
    ),
    page.getByRole("button", { name: "Update password" }).click(),
  ]);
  const res = await req.response();

  return {
    status: res?.status() ?? -1,
    requestBody: req.postDataJSON(),
    responseBody: res ? await res.json() : null,
  };
}

test("real-browser E2E: change password via Settings UI, then verify old/new password at login", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await test.step("1. Register a dedicated test account (via UI)", async () => {
    await page.goto("/register");
    await page.locator("#firstName").fill("PW");
    await page.locator("#lastName").fill("E2E");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(OLD_PASSWORD);
    await page.locator("#agree").check();
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/account/, { timeout: 15000 });
  });

  await test.step("Log out after registration (register auto-logs-in; we want an explicit Login-page login next)", async () => {
    await logout(page);
  });

  await test.step("2. Log in through the real Login page with the OLD password", async () => {
    await login(page, OLD_PASSWORD);
    await page.waitForURL(/\/(account|wallet)/, { timeout: 15000 });
  });

  let firstChange: Awaited<ReturnType<typeof changePasswordViaUi>>;
  await test.step("3-6. Navigate to Settings via UI, fill the form, submit, capture the real HTTP request/response", async () => {
    await goToSettingsViaUi(page);
    firstChange = await changePasswordViaUi(page, OLD_PASSWORD, NEW_PASSWORD);
  });

  await test.step("Check for a success toast and that the form fields cleared", async () => {
    await expect(page.getByText("Password updated")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#currentPassword")).toHaveValue("");
    await expect(page.locator("#newPassword")).toHaveValue("");
    await expect(page.locator("#confirmPassword")).toHaveValue("");
  });

  await test.step("7. Log out via the real UI", async () => {
    await logout(page);
  });

  await test.step("8. Try logging in with the OLD password — must fail", async () => {
    await login(page, OLD_PASSWORD);
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 8000,
    });
    expect(page.url()).toContain("/login");
  });

  await test.step("9. Log in with the NEW password — must succeed", async () => {
    await login(page, NEW_PASSWORD);
    await page.waitForURL(/\/(account|wallet)/, { timeout: 15000 });
  });

  let secondChange: Awaited<ReturnType<typeof changePasswordViaUi>>;
  await test.step("Extra: repeat the change AFTER a full page reload, to rule out a fresh-vs-refreshed state difference", async () => {
    await goToSettingsViaUi(page);
    await page.reload();
    await page.waitForSelector("#currentPassword");
    secondChange = await changePasswordViaUi(page, NEW_PASSWORD, NEWER_PASSWORD);
    await expect(page.getByText("Password updated")).toBeVisible({ timeout: 5000 });
  });

  await test.step("Verify the second change also actually persisted", async () => {
    await logout(page);
    await login(page, NEW_PASSWORD);
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 8000,
    });
    await login(page, NEWER_PASSWORD);
    await page.waitForURL(/\/(account|wallet)/, { timeout: 15000 });
  });

  // Dump the evidence trail for the report — request/response *shape*
  // only, never the actual password values (even though these are just
  // fixture passwords, not real ones — this spec runs repeatedly and
  // its output shouldn't get anyone in the habit of grepping test logs
  // for plaintext passwords).
  const redact = (body: unknown) =>
    body && typeof body === "object"
      ? Object.fromEntries(Object.keys(body).map((k) => [k, "[redacted]"]))
      : body;
  console.log("=== FIRST CHANGE (fresh login) ===");
  console.log("status:", firstChange!.status);
  console.log("requestBody keys:", JSON.stringify(redact(firstChange!.requestBody)));
  console.log("responseBody:", JSON.stringify(firstChange!.responseBody));
  console.log("=== SECOND CHANGE (after page reload) ===");
  console.log("status:", secondChange!.status);
  console.log("requestBody keys:", JSON.stringify(redact(secondChange!.requestBody)));
  console.log("responseBody:", JSON.stringify(secondChange!.responseBody));
  console.log("=== BROWSER CONSOLE ERRORS ===", consoleErrors);
  console.log("=== UNCAUGHT PAGE ERRORS ===", pageErrors);

  expect(firstChange!.status).toBe(200);
  expect(secondChange!.status).toBe(200);
  expect(pageErrors).toEqual([]);
});
