# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GTX is a full-stack **paper-trading** crypto exchange simulator (Next.js 15 App Router + Prisma/Postgres). It streams real Binance market data but all balances/trades/deposits/withdrawals are virtual — no real funds or payment processors are involved. Keep this in mind when working on wallet/deposit/withdrawal code: it's simulated ledger accounting, not real payments integration.

## Commands

```bash
npm run dev                  # Next.js dev server on :3000
npx tsx server/ws/index.ts   # WS market-data relay + trading engine, on :8080 (run separately, needed for live prices/orders to work)

npm run build                # prisma generate && next build
npm run lint                 # next lint
npm run format                # prettier --write .

npx prisma migrate dev       # create/apply a migration in development
npx prisma migrate deploy    # apply migrations (used in prod/migrator container)
npx prisma studio            # DB browser GUI
npx tsx prisma/seed.ts       # (re)run the seed script — creates demo@gtx.com / Demo123! with $10,000 virtual USDT
```

There is no test suite/framework configured in this repo (no `test` script, no jest/vitest config or `*.test.*` files) — don't assume one exists.

`prepare`/husky runs `npx lint-staged` on commit (eslint --fix + prettier on staged `.ts/.tsx`, prettier on `.json/.css/.md`).

### Docker (full stack)

```bash
cp .env.example .env   # set real JWT_ACCESS_SECRET / JWT_REFRESH_SECRET first
docker compose up --build
```

Brings up 4 services: `postgres`, `migrator` (one-shot: `prisma migrate deploy` + seed, must complete before `web`/`ws` start), `web` (Next.js on :3000), `ws` (relay on :8080). The `Dockerfile` has matching multi-stage targets: `deps` → `builder` → `runner` (web), plus standalone `migrator` and `ws` targets that reuse the full `node_modules` (not the standalone-trimmed build) so `prisma`/`tsx` CLIs are available.

## Architecture

### Two processes, one price source of truth

This is the most important thing to understand before touching trading/pricing code. There are **two separate Node processes** that never share memory:

- **`server/ws/index.ts`** (the `ws` container) — the _only_ thing that talks to Binance. It holds a persistent connection to Binance's combined ticker WebSocket stream, keeps the latest prices in an in-process `priceStore` (`lib/binance/price-store.ts`), broadcasts ticks to connected browsers, and every ~5s persists prices into the `Asset` table in Postgres. It also owns the entire trading _engine_ loop: every ~2s it scans open positions for TP/SL/liquidation triggers and pending LIMIT orders for fills, and executes the resulting Postgres writes directly (not via HTTP).
- **Next.js API routes** (the `web` container) — read prices **exclusively from `Asset.lastPrice` in Postgres**, never from `priceStore`, because in a separate process `priceStore` would be empty/stale. Every order/position/portfolio calculation in `app/api/**` goes through the DB for its price.

If you add a new place that needs "the current price," always go through `Asset.lastPrice` (DB) from API routes, and only use `priceStore` from code running inside `server/ws/`. `lib/trading/engine.ts` holds the pure math (margin, PnL, liquidation price, TP/SL checks) shared conceptually by both sides, but note the API routes and the ws service each import and call it independently — there's no shared runtime process.

The browser gets live prices two ways: `hooks/use-live-prices.ts` connects directly to the `ws` container's WebSocket (`NEXT_PUBLIC_WS_URL`) for real-time ticks, while REST calls to `app/api/**` hit Postgres for anything that needs a consistent, transactional price (order execution, PnL, equity).

### Auth

JWT access token (15m, `gtx_access_token` cookie) + refresh token (30d, stored hashed in `RefreshToken` table for revocation) via `jsonwebtoken`. `lib/auth/session.ts`'s `requireUser()` is the standard entry point for API routes — it throws `UnauthorizedError` on missing/invalid token, which `handleApiError` (`lib/api-response.ts`) converts to a 401. `middleware.ts` does a cheap cookie-presence check (no JWT verification) to redirect unauthenticated users away from protected page routes and authenticated users away from `/login`/`/register` — the real verification happens per-request in API routes via `requireUser()`.

### API route conventions

Every route under `app/api/**` follows the same shape: `requireUser()` → optional `rateLimit()` check → Zod parse (`lib/validation/*`) → Prisma query/mutation, often wrapped in `prisma.$transaction` when it touches wallet balance + position/order + trade + notification together → `apiSuccess`/`apiError`/`handleApiError` (`lib/api-response.ts`) for the response envelope (`{ success, data }` / `{ success: false, error, details }`). Follow this pattern for new routes rather than inventing a new response shape.

`lib/rate-limit.ts` is an in-memory sliding-window limiter, per-instance only — noted in the README as needing to move to Redis for multi-instance deployments; don't assume it enforces limits across replicas.

### Data model (`prisma/schema.prisma`)

`User` → `Wallet` (single virtual USDT balance + credit) → `Order` (PENDING/FILLED/CANCELLED) → `Position` (OPEN/CLOSED, isolated-margin style with `margin`/`liquidationPrice` snapshotted at open time) → `Trade` (closed-position history record with realized PnL). `Asset` is the shared price table keyed by Binance `symbol`. Money fields are `Decimal(20, 8)`; convert with `Number()` before doing math with the pure functions in `lib/trading/engine.ts`, which operate on plain `number`s.

### Frontend structure

App Router route groups: `(marketing)` public landing, `(auth)` login/register, `(dashboard)` account/deposit/withdrawal/history/verification/settings/support/downloads — all gated by `middleware.ts`. `trading/` and `markets/` are top-level (also gated for `trading/`). Data fetching uses TanStack Query (`hooks/use-api.ts` for REST) plus the standalone raw WebSocket hook (`hooks/use-live-prices.ts`) for ticker streams — these are independent data paths, not unified through React Query. Charts use `lightweight-charts` (`components/trading/candlestick-chart.tsx`) fed by `app/api/markets/klines/route.ts`, which proxies Binance's REST klines endpoint (`lib/binance/client.ts`).
