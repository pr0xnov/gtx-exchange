/**
 * Pre-production audit fix: lib/email/mailer.ts's sendMail() used to log
 * the full email body — including a password-reset/email-change link's
 * raw `?token=...` value — to console whenever SMTP wasn't configured.
 * That's an accepted dev convenience (no real inbox needed to verify the
 * flow end-to-end) but an unacceptable leak in production, where
 * container logs are far more widely readable than a real inbox: anyone
 * with `docker logs` access could read out a live password-reset token.
 *
 * Now: production with SMTP missing logs only a generic, content-free
 * "not configured" error — never the message body, subject recipient
 * detail aside. Non-production (dev/test) keeps logging the body for
 * local verification, but with any `?token=...` value masked first, so
 * not even the dev convenience path prints the actual secret.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const SECRET_TOKEN = "sekrit_reset_token_abc123XYZ";
const MESSAGE = {
  to: "user@example.com",
  subject: "Reset your password",
  html: `<a href="https://example.com/reset-password?token=${SECRET_TOKEN}">Reset</a>`,
  text: `Reset your password: https://example.com/reset-password?token=${SECRET_TOKEN}`,
};

describe("sendMail — SMTP not configured", () => {
  afterEach(() => {
    // vi.stubEnv, not direct assignment — @types/node marks
    // process.env.NODE_ENV read-only, and vi.unstubAllEnvs() restores
    // vitest.config.ts's global NODE_ENV=test for whichever test file
    // runs next in this same worker.
    vi.unstubAllEnvs();
    delete process.env.APP_URL;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("production: never logs the message body, subject/recipient aside, or the token — only generic errors", async () => {
    vi.stubEnv("NODE_ENV", "production");
    // env.ts requires a real (non-localhost) APP_URL once NODE_ENV is
    // "production" — unrelated to what this test is checking, just a
    // prerequisite for lib/env.ts's own parse to succeed on re-import.
    process.env.APP_URL = "https://gtx.example.com";
    vi.resetModules();

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { sendMail } = await import("@/lib/email/mailer");
    const sent = await sendMail(MESSAGE);

    expect(sent).toBe(false);
    // getTransporter() also logs which SMTP_* *variable names* are
    // missing (never a value) as a plain console.log — harmless
    // (env.ts documents that message; it's covered on its own in that
    // file's own tests, not this file's concern). What matters here is
    // that the actual message content/token appears in NEITHER stream.
    const allOutput = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(" ");
    expect(allOutput).not.toContain(SECRET_TOKEN);
    expect(allOutput).not.toContain(MESSAGE.text);
    expect(allOutput).not.toContain(MESSAGE.html);
    expect(allOutput).not.toContain(MESSAGE.to);
    expect(allOutput).not.toContain(MESSAGE.subject);

    // And the specific "transport not configured" error this fix added
    // did fire, via console.error (not console.log).
    const errorOutput = errorSpy.mock.calls.flat().join(" ").toLowerCase();
    expect(errorOutput).toContain("not configured");
  });

  it("non-production (dev/test): still logs the message for local verification, but the token is redacted", async () => {
    // NODE_ENV defaults to "test" here (see vitest.config.ts) — the same
    // non-production branch development uses.
    vi.resetModules();

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { sendMail } = await import("@/lib/email/mailer");
    const sent = await sendMail(MESSAGE);

    expect(sent).toBe(false);

    const loggedText = logSpy.mock.calls.flat().join(" ");
    // The flow is still verifiable (recipient/subject visible)...
    expect(loggedText).toContain(MESSAGE.to);
    expect(loggedText).toContain(MESSAGE.subject);
    // ...but the actual token value never appears, anywhere.
    expect(loggedText).not.toContain(SECRET_TOKEN);
    expect(loggedText).toContain("[REDACTED]");
  });
});
