import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedAssets } from "../lib/markets/seed-assets";
import { SPOT_CURRENCIES } from "../lib/spot/currencies";
import { generateReferralCode } from "../lib/referral/code";
import { shouldSeedDemoUser } from "../lib/seed/should-seed-demo-user";

const prisma = new PrismaClient();

async function seedDemoUser() {
  const email = "demo@gtx.com";
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    console.log("[seed] demo user already exists, ensuring spot wallets");
  } else {
    const passwordHash = await bcrypt.hash("Demo123!", 12);

    user = await prisma.user.create({
      data: {
        firstName: "Demo",
        lastName: "Trader",
        email,
        passwordHash,
        login: "87654321",
        accountType: "Standard",
        leverageMax: 100,
        referralCode: generateReferralCode(),
        wallet: { create: { balance: 10_000, credit: 0, currency: "USDT" } },
        settings: { create: {} },
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BONUS",
        method: "Welcome bonus",
        amount: 10_000,
        status: "COMPLETED",
      },
    });

    console.log(`[seed] created demo user: ${email} / Demo123!`);
  }

  // Idempotent: also backfills spot wallets for a demo user seeded before
  // spot trading existed.
  for (const currency of SPOT_CURRENCIES) {
    await prisma.spotWallet.upsert({
      where: { userId_currency: { userId: user.id, currency } },
      update: {},
      create: { userId: user.id, currency, balance: currency === "USDT" ? 10_000 : 0 },
    });
  }
  console.log(`[seed] ensured ${SPOT_CURRENCIES.length} spot wallets for demo user`);
}

async function main() {
  console.log("[seed] starting…");
  // Required system data (tradeable assets) — runs in every environment,
  // production included. Never gated on NODE_ENV.
  const count = await seedAssets(prisma);
  console.log(`[seed] upserted ${count} assets`);

  // The demo user (demo@gtx.com / a password fixed in this file, in
  // plain sight in source control) is a dev/test convenience only — a
  // real production deployment must never auto-create a publicly-known
  // login with a funded wallet on every migrator run. Everything else in
  // this file (including seedAssets above) still runs in production;
  // only this one call is skipped.
  if (shouldSeedDemoUser(process.env.NODE_ENV)) {
    await seedDemoUser();
  } else {
    console.log("[seed] NODE_ENV=production — skipping demo user seed.");
  }

  console.log("[seed] complete");
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
