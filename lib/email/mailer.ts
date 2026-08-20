import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null | undefined;

/** Lazily built, memoized — undefined until first checked, then either a
 *  real transporter or null (no SMTP configured) for the life of the process. */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASSWORD) {
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
    // No SMTP provider configured — this is expected in local dev per this
    // project's setup. Log the content so the flow is still verifiable
    // end-to-end without a real inbox, instead of silently doing nothing.
    // eslint-disable-next-line no-console
    console.log(
      `[email:not-configured] to=${message.to} subject="${message.subject}"\n${message.text}`
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
    console.error("[email:send-failed]", error instanceof Error ? error.message : error);
    return false;
  }
}
