import { z } from "zod";

/** A blank `KEY=` line in .env (very common for an optional var someone
 *  hasn't filled in yet — see SMTP_* below) parses as an empty string,
 *  not undefined, so it doesn't hit zod's .optional() default path.
 *  Without this, an empty SMTP_PORT would coerce to 0 and fail
 *  .positive() at import time, crashing the whole app over an unrelated,
 *  genuinely-optional setting nobody configured. */
function blankToUndefined(value: string | undefined): string | undefined {
  return value === "" ? undefined : value;
}

// `next build` bundles route handler modules without executing their
// top-level code, but this defends against the case where it does (or a
// future refactor makes it so): during the actual `next build` phase only,
// a missing secret falls back to a placeholder so the build itself can't
// fail over a secret that a real deployment will supply at runtime. At
// every other time — dev, test, and a running server (`next start` /
// standalone) — a missing secret must fail fast, never sign real tokens
// with a value anyone can read in this file.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
// Same reasoning applies to APP_URL: a silently-defaulted localhost link
// mailed to a real user in production is a broken password-reset/
// email-change email, not just a cosmetic bug — so a production runtime
// with no APP_URL configured must fail loudly instead. Dev/test/build
// keep the localhost default so nothing extra is required to run locally.
const isProductionRuntime = process.env.NODE_ENV === "production" && !isBuildPhase;

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: isBuildPhase
    ? z
        .string()
        .min(32, "JWT_ACCESS_SECRET must be at least 32 chars")
        .default("build_placeholder_access_secret_12345678901234567890")
    : z.string().min(32, "JWT_ACCESS_SECRET is required and must be at least 32 chars"),

  JWT_REFRESH_SECRET: isBuildPhase
    ? z
        .string()
        .min(32, "JWT_REFRESH_SECRET must be at least 32 chars")
        .default("build_placeholder_refresh_secret_12345678901234567890")
    : z.string().min(32, "JWT_REFRESH_SECRET is required and must be at least 32 chars"),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Outbound email (password-changed / email-change-confirmation notices —
  // see lib/email/mailer.ts). All optional: no provider is configured for
  // local dev in this project yet, and mailer.ts intentionally falls back
  // to logging the message instead of sending when these are unset, rather
  // than failing the request that triggered the notification.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  APP_URL: isProductionRuntime
    ? z
        .string()
        .min(1, "APP_URL is required in production — set it to the real public URL")
        .refine(
          (v) => !v.includes("localhost") && !v.includes("127.0.0.1"),
          "APP_URL must be the real public production URL, not localhost"
        )
    : z.string().default("http://localhost:3000"),

  // Admin Panel: key for the reversible current-password encryption used
  // only by SUPER_ADMIN's "Show password" feature (see
  // lib/auth/password-crypto.ts). Deliberately no default/fallback — unlike
  // the JWT secrets above, a missing key here must surface as a clear
  // config error from that one feature, never a silent insecure fallback.
  PASSWORD_ENCRYPTION_KEY: z
    .string()
    .min(32, "PASSWORD_ENCRYPTION_KEY must be at least 32 chars")
    .optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  SMTP_HOST: blankToUndefined(process.env.SMTP_HOST),
  SMTP_PORT: blankToUndefined(process.env.SMTP_PORT),
  SMTP_USER: blankToUndefined(process.env.SMTP_USER),
  SMTP_PASSWORD: blankToUndefined(process.env.SMTP_PASSWORD),
  SMTP_FROM: blankToUndefined(process.env.SMTP_FROM),
  APP_URL: blankToUndefined(process.env.APP_URL),
  PASSWORD_ENCRYPTION_KEY: blankToUndefined(process.env.PASSWORD_ENCRYPTION_KEY),
});
