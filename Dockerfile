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
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]

# ---------------------------------------------------------------------------
# Migrator: one-shot container that runs `prisma migrate deploy` + seed.
# Uses the full (non-standalone-trimmed) node_modules so the `prisma` CLI
# and `tsx` (for the TypeScript seed script) are available.
# ---------------------------------------------------------------------------
FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts"]

# ---------------------------------------------------------------------------
# WebSocket relay: long-running market data + trading engine service.
# Runs server/ws/index.ts directly via tsx (no Next.js build needed here).
# ---------------------------------------------------------------------------
FROM base AS ws
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 8080
CMD ["npx", "tsx", "server/ws/index.ts"]

