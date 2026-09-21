import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null | undefined;

function missingSmtpVars(): string[] {
  const missing: string[] = [];
  if (!env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!env.SMTP_PORT) missing.push("SMTP_PORT");
  if (!env.SMTP_USER) missing.push("SMTP_USER");
  if (!env.SMTP_PASSWORD) missing.push("SMTP_PASSWORD");
  return missing;
}

/** Lazily built, memoized — undefined until first checked, then either a
 *  real transporter or null (no SMTP configured) for the life of the process. */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const missing = missingSmtpVars();
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[email:not-configured] Missing environment variable(s): ${missing.join(", ")}. ` +
        "Set them (and rebuild/restart the web container if running under Docker — " +
        "see docker-compose.yml's web.environment block) to actually send email."
    );
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  return transporter;
}

/** Masks the value of any `?token=...`/`&token=...` query parameter — the
 *  shape every sensitive link this app emails uses (password-reset,
 *  email-change confirmation; see forgot-password/route.ts and settings/
 *  email/request/route.ts). Keeps the rest of the message (subject,
 *  greeting, surrounding text) intact for local debugging, so the dev-only
 *  console fallback below stays useful without ever printing the actual
 *  secret that link grants. */
function redactTokens(text: string): string {
  return text.replace(/([?&]token=)[^\s&"'<]+/gi, "$1[REDACTED]");
}

/** True SMTP-error codes nodemailer/Node's net & tls modules actually set
 *  (EAUTH, ECONNECTION, ETIMEDOUT, ESOCKET, ...) — logging this alongside
 *  the message turns "something failed" into "auth failed" / "connection
 *  timed out" / "TLS handshake failed", which is the whole point of this
 *  diagnostic path (see the investigation this was added for). */
function describeError(error: unknown): string {
  if (error && typeof error === "object") {
    const code = "code" in error ? String((error as { code: unknown }).code) : undefined;
    const responseCode =
      "responseCode" in error
        ? String((error as { responseCode: unknown }).responseCode)
        : undefined;
    const message = error instanceof Error ? error.message : String(error);
    return [
      code && `code=${code}`,
      responseCode && `responseCode=${responseCode}`,
      message,
    ]
      .filter(Boolean)
      .join(" ");
  }
  return String(error);
}

/**
 * Opens a real connection to the configured SMTP server (auth included)
 * without sending a message — nodemailer's own verify() call. Use this to
 * find out *why* email isn't arriving (bad host/port, wrong credentials,
 * TLS mismatch, server unreachable from inside the container) without
 * needing a real inbox to check. Returns a clear, specific reason on
 * failure rather than a generic boolean.
 */
export async function verifySmtpConnection(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  const missing = missingSmtpVars();
  if (missing.length > 0) {
    return { ok: false, reason: `Not configured — missing ${missing.join(", ")}` };
  }
  const t = getTransporter();
  if (!t) return { ok: false, reason: "Transporter unavailable" };

  try {
    await t.verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: describeError(error) };
  }
}

/**
 * Sends a security/account notification email. Never throws — a delivery
 * failure (or, in local dev, no SMTP provider configured at all) must
 * never roll back or fail the database change that triggered it (e.g. a
 * password change is already committed by the time this is called).
 * Returns whether it actually sent, purely for logging/telemetry; callers
 * don't need to branch on it.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const t = getTransporter();

  if (!t) {
    if (env.NODE_ENV === "production") {
      // Fail securely — a production deployment with SMTP left
      // unconfigured must never print a password-reset/email-change link
      // (or any other message body) to the container's logs, which are
      // far more widely readable than a real inbox would be. No message
      // content, no recipient-specific detail — just enough to make the
      // misconfiguration itself loud and obvious in `docker logs`.
      // eslint-disable-next-line no-console
      console.error("[email:not-configured] Email transport is not configured.");
      return false;
    }
    // Dev/test convenience: log the content so the flow is still
    // verifiable end-to-end without a real inbox — but with any
    // `?token=...` value masked (see redactTokens above), so a
    // password-reset/email-change link's actual secret is never printed
    // even here.
    // eslint-disable-next-line no-console
    console.log(
      `[email:not-configured] to=${message.to} subject="${message.subject}"\n${redactTokens(message.text)}`
    );
    return false;
  }

  try {
    await t.sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[email:send-failed]", describeError(error));
    return false;
  }
}
