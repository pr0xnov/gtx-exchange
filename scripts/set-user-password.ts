/**
 * Controlled, offline password rotation for any existing account —
 * primarily meant for replacing a dev/test-era admin password with a real
 * production one right after deploy, without ever putting the new
 * password in source code, a commit, or an HTTP request. Run via:
 *
 *   npm run set-user-password -- --email=admin@gtx.exchange
 *   npm run set-user-password -- --email=admin@gtx.exchange --password=...
 *
 * With no --password, a strong random one is generated (the same
 * generateStrongPassword() the Admin Panel's own "Reset Password" button
 * uses) and printed to stdout exactly once — copy it immediately, it is
 * never stored, logged, or retrievable again afterward. Passing --password
 * explicitly is supported for scripted/one-time-init flows that generate
 * their own secret (e.g. from a secrets manager) and never want it to
 * touch shell history; prefer piping it in over typing it directly.
 *
 * Hashed with the exact same lib/auth/password.ts bcrypt helper (and
 * lib/auth/password-crypto.ts's encryption, for the SUPER_ADMIN "Show
 * password" feature) every other password goes through — mirrors
 * app/api/admin/users/[id]/reset-password/route.ts's own update exactly,
 * just without requiring an existing admin session to call it.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateStrongPassword } from "../lib/auth/password";
import { maybeEncryptPassword } from "../lib/auth/password-crypto";
import { createAuditLog } from "../lib/audit/log";

const prisma = new PrismaClient();

const PASSWORD_RULES: [RegExp, string][] = [
  [/.{8,}/, "at least 8 characters"],
  [/[A-Z]/, "an uppercase letter"],
  [/[0-9]/, "a number"],
];

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = /^--([a-zA-Z]+)=(.*)$/.exec(arg);
    if (match) args[match[1]!] = match[2]!;
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const email = args.email?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    console.error(
      "Usage: npm run set-user-password -- --email=you@example.com [--password=...]"
    );
    process.exit(1);
  }

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) {
    console.error(`[set-user-password] No account found for ${email}.`);
    process.exit(1);
  }

  const password = args.password ?? generateStrongPassword();
  if (args.password) {
    const failedRule = PASSWORD_RULES.find(([re]) => !re.test(password));
    if (failedRule) {
      console.error(`[set-user-password] Password must contain ${failedRule[1]}.`);
      process.exit(1);
    }
  }

  const passwordHash = await hashPassword(password);
  const encryptedPassword = maybeEncryptPassword(password);

  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash, encryptedPassword },
  });

  // No adminId: this is the account's own password changing (via CLI
  // instead of the app), the same "plain user's own event" case
  // lib/audit/log.ts's own doc comment describes for login/logout/2FA —
  // not an admin acting on someone else.
  await createAuditLog({
    targetUserId: target.id,
    action: "CLI_PASSWORD_ROTATION",
    metadata: { targetEmail: target.email },
  });

  console.log(
    `[set-user-password] Password updated for ${target.email} (${target.role}).`
  );
  if (!args.password) {
    console.log(`[set-user-password] New password (copy now — shown only this once):`);
    console.log(password);
  }
}

main()
  .catch((error) => {
    console.error("[set-user-password] Failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
