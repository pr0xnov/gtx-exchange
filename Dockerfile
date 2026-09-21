# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base image with pnpm/npm and OpenSSL (required by Prisma engines)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---------------------------------------------------------------------------
# Dependencies layer (cached separately from source for faster rebuilds)
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

# ---------------------------------------------------------------------------
# Build layer
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL is only needed here for `prisma generate`, not for querying.
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
# NEXT_PUBLIC_* values are inlined into the client bundle at this build
# step, not read at container runtime — docker-compose.yml's `web.environment`
# NEXT_PUBLIC_WS_URL only ever reached the server process, never the browser
# bundle, without this ARG/ENV pair (see hooks/use-live-prices.ts's
# "ws://localhost:8080" fallback, which is what silently shipped instead on
# every prior build). Must be passed as a --build-arg (docker-compose.yml
# wires this via `web.build.args`) with the real public wss:// URL once a
# domain exists; the fallback below only keeps local `docker compose build`
# usable before that.
ARG NEXT_PUBLIC_WS_URL="ws://localhost:8080"
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime layer for the Next.js app (standalone server)
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Doesn't exist in the standalone build output — created here (rather than
# left to the first cache write) so it has the right owner *before* the
# gtx_next_cache volume (see docker-compose.yml) mounts over it. A named
# volume mounted onto a path that doesn't pre-exist in the image would
# otherwise be created root-owned, and the non-root `nextjs` user below
# could never write to it.
RUN mkdir -p ./.next/cache && chown -R nextjs:nodejs ./.next/cache
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Liveness check against app/api/health (a plain 200, no DB query — see
# that route's own comment for why). Uses Node's own built-in fetch, not
# curl/wget — neither is installed in this alpine image, and adding one
# just for this would be a needless extra package. start-period gives the
# standalone server room to finish booting before a slow first check
# would otherwise count as a failure.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]

# ---------------------------------------------------------------------------
# Migrator: one-shot container that runs `prisma migrate deploy` + seed.
# Uses the full (non-standalone-trimmed) node_modules so the `prisma` CLI
# and `tsx` (for the TypeScript seed script) are available. Only applies
# existing migration SQL against the DB over the network and reads (never
# writes) the seed script, so it needs no elevated filesystem access —
# `prisma generate` still runs as root, before the user switch, exactly
# like the runner stage below, so the generated client files exist first.
# ---------------------------------------------------------------------------
FROM base AS migrator
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
USER nextjs
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts"]

# ---------------------------------------------------------------------------
# WebSocket relay: long-running market data + trading engine service.
# Runs server/ws/index.ts directly via tsx (no Next.js build needed here).
# Same non-root reasoning as migrator above — a network service with no
# local filesystem writes.
# ---------------------------------------------------------------------------
FROM base AS ws
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
USER nextjs
EXPOSE 8080

# Liveness check — a plain TCP connect to the relay's own listen port,
# not a full WebSocket handshake (that would be a heavier check than a
# periodic healthcheck needs, and would show up as extra "client
# connected/disconnected" log noise every interval). Confirms the process
# is up and accepting connections, same bar the web healthcheck above
# uses; the `ws` npm package itself already only tracks real browser
# clients (see server/ws/index.ts), so this raw connect+close never
# reaches application code at all.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const net=require('net');const s=net.connect(process.env.WS_PORT||8080,'127.0.0.1');const done=(code)=>{try{s.destroy()}catch(e){}process.exit(code)};s.on('connect',()=>done(0));s.on('error',()=>done(1));setTimeout(()=>done(1),3000)"

CMD ["npx", "tsx", "server/ws/index.ts"]

