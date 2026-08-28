import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import type { MailMessage } from "@/lib/email/mailer";

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

/** Plain, inline-styled HTML — no build step/external template engine
 *  needed for these few short transactional messages. */
function wrapHtml(heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:32px 16px;background:#0B0F17;font-family:Inter,-apple-system,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#131A23;border:1px solid #1F2937;border-radius:16px;padding:32px;">
      <div style="color:#22C55E;font-weight:700;font-size:20px;margin-bottom:24px;">GTX</div>
      <h1 style="color:#F3F4F6;font-size:18px;margin:0 0 16px;">${heading}</h1>
      ${bodyHtml}
    </div>
  </body>
</html>`;
}

function formatEventDate(locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
}

export function passwordChangedEmail(locale: Locale, to: string): MailMessage {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const date = formatEventDate(locale);
  const body = interpolate(t("email.passwordChanged.body"), { date });
  const notice = t("email.passwordChanged.notYouNotice");

  return {
    to,
    subject: t("email.passwordChanged.subject"),
    text: `${body}\n\n${notice}`,
    html: wrapHtml(
      t("email.passwordChanged.heading"),
      `<p style="color:#D1D5DB;font-size:14px;line-height:1.6;">${body}</p>
       <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin-top:24px;">${notice}</p>`
    ),
  };
}

export function emailChangeConfirmEmail(
  locale: Locale,
  to: string,
  confirmUrl: string
): MailMessage {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const body = t("email.emailChangeConfirm.body");
  const button = t("email.emailChangeConfirm.button");
  const expiry = t("email.emailChangeConfirm.expiryNotice");

  return {
    to,
    subject: t("email.emailChangeConfirm.subject"),
    text: `${body}\n\n${confirmUrl}\n\n${expiry}`,
    html: wrapHtml(
      t("email.emailChangeConfirm.heading"),
      `<p style="color:#D1D5DB;font-size:14px;line-height:1.6;">${body}</p>
       <a href="${confirmUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#22C55E;color:#0B0F17;font-weight:600;font-size:14px;border-radius:12px;text-decoration:none;">${button}</a>
       <p style="color:#9CA3AF;font-size:13px;line-height:1.6;">${expiry}</p>`
    ),
  };
}

export function passwordResetRequestEmail(
  locale: Locale,
  to: string,
  resetUrl: string
): MailMessage {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const body = t("email.passwordResetRequest.body");
  const button = t("email.passwordResetRequest.button");
  const expiry = t("email.passwordResetRequest.expiryNotice");
  const notice = t("email.passwordResetRequest.notYouNotice");

  return {
    to,
    subject: t("email.passwordResetRequest.subject"),
    text: `${body}\n\n${resetUrl}\n\n${expiry}\n\n${notice}`,
    html: wrapHtml(
      t("email.passwordResetRequest.heading"),
      `<p style="color:#D1D5DB;font-size:14px;line-height:1.6;">${body}</p>
       <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#22C55E;color:#0B0F17;font-weight:600;font-size:14px;border-radius:12px;text-decoration:none;">${button}</a>
       <p style="color:#9CA3AF;font-size:13px;line-height:1.6;">${expiry}</p>
       <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin-top:16px;">${notice}</p>`
    ),
  };
}

/**
 * Sent after an admin's Balance Adjustment (see
 * app/api/admin/balance-adjustments/route.ts) — deliberately carries only
 * asset/amount/direction. No admin identity, internal reason text, or
 * anything else from the Audit Log entry leaks into what the user sees.
 */
export function balanceAdjustedEmail(
  locale: Locale,
  to: string,
  params: { asset: string; amount: number; direction: "CREDIT" | "DEBIT" }
): MailMessage {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const bodyKey =
    params.direction === "CREDIT"
      ? "email.balanceAdjusted.bodyCredit"
      : "email.balanceAdjusted.bodyDebit";
  const headingKey =
    params.direction === "CREDIT"
      ? "email.balanceAdjusted.headingCredit"
      : "email.balanceAdjusted.headingDebit";
  const body = interpolate(t(bodyKey), {
    asset: params.asset,
    amount: String(params.amount),
  });
  const footer = t("email.balanceAdjusted.footer");

  return {
    to,
    subject: t("email.balanceAdjusted.subject"),
    text: `${body}\n\n${footer}`,
    html: wrapHtml(
      t(headingKey),
      `<p style="color:#D1D5DB;font-size:14px;line-height:1.6;">${body}</p>
       <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin-top:24px;">${footer}</p>`
    ),
  };
}

export function emailChangedNoticeEmail(
  locale: Locale,
  to: string,
  newEmail: string
): MailMessage {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const date = formatEventDate(locale);
  const body = interpolate(t("email.emailChanged.body"), { newEmail, date });
  const notice = t("email.emailChanged.notYouNotice");

  return {
    to,
    subject: t("email.emailChanged.subject"),
    text: `${body}\n\n${notice}`,
    html: wrapHtml(
      t("email.emailChanged.heading"),
      `<p style="color:#D1D5DB;font-size:14px;line-height:1.6;">${body}</p>
       <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin-top:24px;">${notice}</p>`
    ),
  };
}
