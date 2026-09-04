/**
 * Controlled creation of the first (or any subsequent) admin account —
 * deliberately NOT exposed through the public /register form or any
 * API route a browser could reach. Run via:
 *
 *   npm run create-admin -- --email=admin@gtx.exchange --password=... --firstName=Admin --lastName=User [--role=SUPER_ADMIN|ADMIN]
 *
 * If the email already belongs to an existing account, this only
 * promotes that account's role (password/name are left untouched) —
 * the common case of turning an existing user into an admin. If the
 * email is new, all four flags (email/password/firstName/lastName) are
 * required and a full account (wallet, spot wallets, settings — same
 * shape app/api/auth/register/route.ts creates) is created with that role.
 *
 * The password is hashed with the exact same lib/auth/password.ts
 * bcrypt helper every other account's password goes through — it is
 * never written anywhere in plain text, including this script's own
 * process memory beyond the single hashPassword() call.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { maybeEncryptPassword } from "../lib/auth/password-crypto";
import { generateLoginId } from "../lib/utils";
import { SPOT_CURRENCIES } from "../lib/spot/currencies";
import { generateReferralCode } from "../lib/referral/code";

const prisma = new PrismaClient();
const MAX_REFERRAL_CODE_GENERATION_ATTEMPTS = 5;

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
  const role = args.role === "ADMIN" ? "ADMIN" : "SUPER_ADMIN";

  if (!email || !email.includes("@")) {
    console.error(
      "Usage: npm run create-admin -- --email=you@example.com --password=... --firstName=... --lastName=... [--role=SUPER_ADMIN|ADMIN]"
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === role) {
      console.log(`[create-admin] ${email} is already ${role} — nothing to do.`);
      return;
    }
    await prisma.user.update({ where: { id: existing.id }, data: { role } });
    console.log(`[create-admin] Promoted existing account ${email} to ${role}.`);
    return;
  }

  const { password, firstName, lastName } = args;
  if (!password || !firstName || !lastName) {
    console.error(
      `[create-admin] No account exists for ${email} yet — creating one requires --password, --firstName, and --lastName too.`
    );
    process.exit(1);
  }

  const failedRule = PASSWORD_RULES.find(([re]) => !re.test(password));
  if (failedRule) {
    console.error(`[create-admin] Password must contain ${failedRule[1]}.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const encryptedPassword = maybeEncryptPassword(password);

  let user;
  for (let attempt = 0; attempt < MAX_REFERRAL_CODE_GENERATION_ATTEMPTS; attempt++) {
    try {
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          encryptedPassword,
          role,
          login: generateLoginId(),
          referralCode: generateReferralCode(),
          wallet: { create: { balance: 0, credit: 0, currency: "USDT" } },
          settings: { create: {} },
          spotWallets: {
            create: SPOT_CURRENCIES.map((currency) => ({ currency, balance: 0 })),
          },
        },
      });
      break;
    } catch (err) {
      const isReferralCodeCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[] | undefined)?.includes("referralCode");
      if (!isReferralCodeCollision) throw err;
    }
  }
  if (!user) {
    console.error("[create-admin] Could not generate a unique referral code, try again.");
    process.exit(1);
  }

  console.log(`[create-admin] Created ${role} account ${user.email} (id: ${user.id}).`);
}

main()
  .catch((error) => {
    console.error("[create-admin] Failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
