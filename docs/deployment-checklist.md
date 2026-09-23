# VPS deployment checklist

Consolidates the "must verify on the real VPS, not just trust the source
files" items surfaced by the pre-production security audits. Nothing in
this file has been run against a VPS — there isn't one yet. Work through
this in order the first time `docker compose up` runs for real.

## 1. Environment variables (`.env` on the VPS)

Set **before** `docker compose build`, not just before `up` — the
`NEXT_PUBLIC_*` ones below are baked into the client JS bundle at build
time and require a rebuild (not just a restart) if set incorrectly:

- [ ] `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — real values,
      not the local-dev example ones.
- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — `openssl rand -base64 48`
      each, ≥32 chars.
- [ ] `APP_URL` — the real public `https://` URL. The app refuses to start
      in production with a localhost value (see `lib/env.ts`).
- [ ] `NEXT_PUBLIC_WS_URL` — `wss://your-domain` (or `wss://your-domain/ws`
      behind a reverse proxy). **Baked in at build time** — verify by
      checking the deployed site's browser console/network tab actually
      connects to the real domain, not `ws://localhost:8080`.
- [ ] `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM`
      — **set these before real users can request a password reset.** If
      left unset, `lib/email/mailer.ts` now fails securely (logs only
      "Email transport is not configured", never the reset link/token) —
      but that also means password reset silently doesn't work at all
      until SMTP is configured. Verify with a real reset request that an
      email actually arrives.
- [ ] `TRUST_PROXY_HEADERS` — leave `false` until the reverse proxy step
      (§3) is done and confirmed. Only flip to `true` once you've verified
      the proxy overwrites `X-Forwarded-For`/`X-Real-IP` rather than
      passing a client-supplied copy through — see
      `lib/security/client-ip.ts`'s own doc comment.
      `lib/rate-limit.ts`'s login/register/forgot-password/reset-password
      throttling depends on this
      being correct: while `false`, all untrusted traffic shares a single
      rate-limit bucket (safe but coarse); flipping it on prematurely
      (proxy not actually stripping the header) lets any client spoof a
      fresh IP per request and defeat those limits.
- [ ] `PASSWORD_ENCRYPTION_KEY` — optional; only needed for the
      SUPER_ADMIN "Show password" feature.

## 2. PostgreSQL port exposure

`docker-compose.yml` already binds postgres to `127.0.0.1:5432:5432`
(loopback only) — **do not change this back to a bare `5432:5432`.**

- [ ] After `docker compose up`, confirm the binding actually took effect
      on this specific container:

      ```sh
      docker inspect $(docker compose ps -q postgres) \
        --format '{{json .NetworkSettings.Ports}}'
      ```

      Expected: `"HostIp":"127.0.0.1"`. If it ever shows `"0.0.0.0"`
      instead, the container was created before a `docker-compose.yml`
      port-binding fix and was never recreated —
      `docker compose up -d --force-recreate postgres` fixes it (does
      **not** touch the `gtx_postgres_data` volume; the named volume, not
      the container, is where the data actually lives).

- [ ] Confirm the VPS's own firewall (ufw/iptables/cloud provider security
      group) does not additionally forward port 5432 from the public
      internet regardless of Docker's own binding — Docker's port
      publishing and the host firewall are two independent layers.

**Whether the host port is needed at all:** `web`, `migrator`, and `ws` all
connect to Postgres via `DATABASE_URL=...@postgres:5432/...` — the Docker
Compose internal service DNS name, never `localhost`/the host port. The
`127.0.0.1:5432:5432` mapping exists _only_ for host-side tooling (`psql`,
Prisma Studio, a DB GUI) — the app itself would work identically with no
host port published at all. `docker compose exec postgres psql -U
"$POSTGRES_USER" -d "$POSTGRES_DB"` (no host port required) already
covers that same need, the same way `scripts/backup-postgres.sh` reaches
Postgres. **Not changed here** — this is a real option worth considering
(removing the host port entirely is strictly more isolated than binding
it to loopback), but it's a decision for whoever runs the VPS, not
something to flip automatically without confirming nothing else on that
machine expects `localhost:5432` to work.

## 3. Reverse proxy + HTTPS

- [ ] nginx/Caddy (or similar) in front, terminating TLS, proxying to
      `127.0.0.1:3000` (web) and `127.0.0.1:8080` or a `/ws` path (ws).
- [ ] Proxy config explicitly **overwrites** `X-Forwarded-For`/`X-Real-IP`
      (does not blindly append/pass through a client-supplied value) —
      this is the actual security boundary `TRUST_PROXY_HEADERS=true`
      assumes exists once you flip it on.
- [ ] Once HTTPS is confirmed working end-to-end, consider adding HSTS —
      deliberately not enabled yet (`next.config.ts`'s own comment) since
      enabling it before HTTPS is confirmed can lock out plain-HTTP access
      before you're sure the proxy is right.
- [ ] CSP: deliberately not configured yet either — needs its own pass
      (inline hydration scripts, the WS connection, image hosts, fonts) —
      don't guess one in under this checklist.

## 4. Database migrations & seed data

- [ ] `migrator` runs `prisma migrate deploy && npx tsx prisma/seed.ts`
      automatically on `docker compose up`. Confirm `NODE_ENV=production`
      actually reaches that container (`docker compose exec migrator env | grep NODE_ENV`
      right after it runs, or check its logs for
      `[seed] NODE_ENV=production — skipping demo user seed.`).
- [ ] Confirm `demo@gtx.com` was **not** created on this deployment:

      ```sh
      docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -c "SELECT email FROM \"User\" WHERE email = 'demo@gtx.com';"
      ```

      Expected: 0 rows, on a genuinely fresh production database.

## 5. Admin account

- [ ] Create the first production admin (no admin is seeded automatically —
      `scripts/create-admin.ts` is the only way one is ever created):

      ```sh
      npm run create-admin -- --email=admin@gtx.exchange --password=... \
        --firstName=Admin --lastName=User --role=SUPER_ADMIN
      ```

- [ ] If this deployment's `admin@gtx.exchange` account already existed
      from local development (dev/test-era password), **rotate its
      password before real users can reach the site** —
      `scripts/set-user-password.ts` does this without ever putting the
      new password in source code, a commit, or an HTTP request:

      ```sh
      npm run set-user-password -- --email=admin@gtx.exchange
      ```

      With no `--password`, a strong one is generated and printed to
      stdout exactly once — copy it immediately (e.g. into your password
      manager), it is never stored or retrievable again afterward. Confirm
      you can log in with it, then treat the old dev/test password as
      permanently invalid.

      **Note:** unlike the Settings > Security > Change Password flow
      (see "Session revocation on password change" below), this script
      does **not** revoke existing sessions — it writes the new hash
      directly via Prisma, bypassing the API route's revocation logic.
      If a dev-era session for this account might still be alive
      somewhere, don't rely on this rotation alone to kill it.

- [ ] Admin email is already a neutral operational address
      (`admin@gtx.exchange`), not a personal one — keep it that way for
      any additional admin accounts created later.

### Session revocation on password change

`POST /api/settings/password` (Settings > Security > Change Password)
revokes **every** refresh token belonging to that user — any device,
tab, or previously-issued session — atomically alongside the password
hash update, in the same DB transaction. This applies to every account,
not just admins.

This is specific to that one API route. `scripts/set-user-password.ts`
(used above for the initial admin rotation) writes the new hash directly
via Prisma and does **not** go through this logic, so it does not revoke
anything — see the note on that step.

- The still-live access token (15 minutes) keeps working until its own
  natural expiry, since it carries no password-derived claim (see
  `lib/auth/jwt.ts`) — this is deliberate, not a gap: revoking it early
  would need either a token-denylist or shorter TTLs, neither justified
  by this change.
- Once that access token expires, the existing revoked-token check
  already in `POST /api/auth/refresh` rejects it — no separate
  invalidation path was added.
- A stolen or forgotten-about refresh token (another device, an old
  session) stops being usable for a fresh session the moment the
  password changes, without needing that device to be reachable.

## 6. Healthchecks

- [ ] `docker compose ps` shows `web` and `ws` as `healthy` (not just
      `running`) a minute or so after startup.
- [ ] `curl -f http://127.0.0.1:3000/api/health` (from the VPS host, or
      `docker compose exec web wget ...` equivalent) returns 200.

## 7. Backups

- [ ] `./scripts/backup-postgres.sh` run once by hand, confirms a dump
      lands in `/var/backups/gtx/`.
- [ ] `./scripts/verify-backup-restore.sh` run once, confirms that dump
      actually restores.
- [ ] `gtx-backup.timer` (or the cron equivalent) installed and enabled —
      see `docs/backup.md` for both options.
- [ ] Off-box copy of the backup directory configured (rsync/rclone/etc.)
      — a backup that lives only on the same disk as the database doesn't
      survive a disk failure. Not scripted here; depends on your chosen
      off-box storage.

## 8. Smoke test

- [ ] Register a real test account through the live site, confirm email
      (if SMTP is configured) or password reset arrives.
- [ ] Log in, view `/trading`, confirm the chart loads and live prices
      update (WebSocket actually connecting to the real `wss://` URL, not
      a stale `ws://localhost:8080`).
- [ ] Check the browser console for any CSP/mixed-content/WS-connection
      errors.
- [ ] Delete the smoke-test account (or leave a note that it's test data,
      the same way this project's own test accounts are always
      `@example.test` — never reuse a real-looking email for this).
- [ ] Confirm session revocation on password change: log in as the
      smoke-test account in two separate browsers (or one normal + one
      private/incognito window), change the password in one, then confirm
      `POST /api/auth/refresh` from the other fails once its access token
      expires (or immediately, if you clear its access-token cookie to
      force a refresh) — see "Session revocation on password change"
      under §5 above.
