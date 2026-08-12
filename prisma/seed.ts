import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TRACKED_SYMBOLS, fetchTickerSnapshot } from "../lib/binance/client";
import { SPOT_CURRENCIES } from "../lib/spot/currencies";

const prisma = new PrismaClient();

const DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: "BTC/USD",
  ETHUSDT: "ETH/USD",
  BNBUSDT: "BNB/USD",
  SOLUSDT: "SOL/USD",
  XRPUSDT: "XRP/USD",
  ADAUSDT: "ADA/USD",
  DOGEUSDT: "DOGE/USD",
  LTCUSDT: "LTC/USD",
};

// Fallback baseline prices used if Binance can't be reached at seed time
// (e.g. offline/CI environments). The live WS service overwrites these the
// moment it connects.
const FALLBACK_PRICES: Record<string, number> = {
  BTCUSDT: 66241.3,
  ETHUSDT: 3221.35,
  BNBUSDT: 592.4,
  SOLUSDT: 148.2,
  XRPUSDT: 0.52,
  ADAUSDT: 0.45,
  DOGEUSDT: 0.16,
  LTCUSDT: 84.7,
};

async function seedAssets() {
  let snapshots: Record<string, { price: number; changePercent24h: number }> = {};

  try {
    const live = await fetchTickerSnapshot();
    snapshots = Object.fromEntries(live.map((t) => [t.symbol, t]));
    console.log("[seed] fetched live prices from Binance");
  } catch {
    console.warn("[seed] could not reach Binance, using fallback prices");
  }

  for (const symbol of TRACKED_SYMBOLS) {
    const snapshot = snapshots[symbol];
    await prisma.asset.upsert({
      where: { symbol },
      update: {},
      create: {
        symbol,
        displaySymbol: DISPLAY_NAMES[symbol],
        baseAsset: symbol.replace("USDT", ""),
        quoteAsset: "USDT",
        category: "Cryptocurrencies",
        lastPrice: snapshot?.price ?? FALLBACK_PRICES[symbol],
        change24h: snapshot?.changePercent24h ?? 0,
      },
    });
  }
  console.log(`[seed] upserted ${TRACKED_SYMBOLS.length} assets`);
}

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
  await seedAssets();
  await seedDemoUser();
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
