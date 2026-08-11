# GTX — Paper Trading Cryptocurrency Exchange

A full-stack training/paper-trading platform with live Binance market data,
TradingView-style charts, leveraged long/short positions, and a UI modeled on
commercial exchanges (Binance/Bybit/OKX-style dark theme). **All balances and
trades are virtual — no real funds are ever involved.**

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zustand-ready, TanStack Query, Framer Motion, Lightweight Charts
- **Backend:** Next.js API Routes, JWT + refresh-token auth, Zod validation
- **Database:** PostgreSQL + Prisma ORM
- **Realtime:** A dedicated WebSocket relay service that streams Binance's public ticker feed to the browser and runs the TP/SL/liquidation/limit-order engine
- **Infra:** Docker Compose (Postgres + one-shot migrator + Next.js app + WS relay)

## Architecture note: two containers, one price source of truth

Binance market data is only ever fetched by the **`ws`** container. It writes
the latest price into its own memory (for instant WebSocket broadcast to
browsers) **and** persists it to the `Asset` table in Postgres every ~5s. The
**`web`** container (Next.js API routes) always reads prices from the
`Asset` table — never from the `ws` container's memory, since they're
separate processes. This is why order execution, PnL, and portfolio equity
all query `Asset.lastPrice` rather than any shared in-memory cache.

## Quick start

```bash
cp .env.example .env
# edit .env and set real JWT_ACCESS_SECRET / JWT_REFRESH_SECRET values
docker compose up --build
```

Then open **http://localhost:3000**.

This one command will:
1. Start Postgres and wait for it to be healthy
2. Run the `migrator` service (`prisma migrate deploy` + seed script) once, to completion
3. Start the Next.js app on port 3000
4. Start the WebSocket market-data relay on port 8080

## Demo account

```
Email:    demo@gtx.com
Password: Demo123!
```

Created automatically by the seed script, with a $10,000 virtual USDT balance.

## Local development (without Docker)

Requires Node 20+ and a local Postgres instance.

```bash
npm install
cp .env.example .env   # point DATABASE_URL at your local Postgres
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev             # Next.js on :3000
npx tsx server/ws/index.ts   # in a second terminal — WS relay on :8080
```

## Project structure

```
app/                     Next.js App Router pages & API routes
  (marketing)/            Public landing page
  (auth)/                 Login / Register
  (dashboard)/             Account, Deposit, Withdrawal, History, Verification,
                           Settings, Support, Downloads (all behind middleware)
  trading/                 Trading terminal
  markets/                 Markets browser
  api/                     REST endpoints (auth, orders, positions, wallet, etc.)
components/               UI components grouped by feature
hooks/                    React Query + WebSocket client hooks
lib/                      Auth, trading engine, Binance client, validation, utils
prisma/                   schema.prisma, migrations, seed.ts
server/ws/                Standalone WebSocket relay + trading engine service
docker/                   Container entrypoint scripts
Dockerfile                Multi-stage build (runner / migrator / ws targets)
docker-compose.yml        Full orchestration
```

## Notes & limitations

- This is an educational simulator. It is not connected to any real exchange, custodian, or payment processor — deposits/withdrawals only move virtual balances in Postgres.
- Binance's public REST/WebSocket market-data endpoints are used and require outbound internet access from the `ws` container at runtime.
- Rate limiting is in-memory and per-instance; for a multi-instance production deployment, back `lib/rate-limit.ts` with Redis instead.
