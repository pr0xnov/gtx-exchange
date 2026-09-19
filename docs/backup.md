# PostgreSQL backup & restore

GTX holds real financial state (balances, deposits, withdrawals, orders) in
a single Postgres instance with no replica. Before real users touch this
deployment, a backup job must be running — none exists yet as of this
writing. This document specifies the plan; it does not itself set up a
cron job or run any backup/restore commands.

## Backup command

Run from the Docker host, against the running `postgres` container:

```sh
docker compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  > "/var/backups/gtx/gtx_$(date +%Y%m%d_%H%M%S).dump"
```

- `--format=custom` (not plain SQL) so `pg_restore` can do a selective or
  parallel restore later, and so the dump is compressed by default.
- Run this on a schedule (cron / systemd timer) — e.g. every 6 hours — from
  the VPS host, not from inside a container that gets recreated on deploy.

## Backup directory

`/var/backups/gtx/` on the VPS host (outside any Docker volume, so a
`docker compose down`/image rebuild can never touch it). This directory
must:

- Not be web-served or reachable from any exposed port.
- Be copied off-box on a schedule (e.g. rsync/rclone to separate storage) —
  a backup that lives only on the same disk as the database it backs up
  doesn't survive a disk failure.

## Retention

- Keep hourly-or-finer backups for 48 hours, daily backups for 30 days,
  weekly for a further 90 days. Prune older dumps on the same schedule
  that creates new ones.
- Financial data (balances, transaction history) — err toward longer
  retention rather than shorter; disk cost is cheap relative to the cost of
  an unrecoverable gap during an incident investigation.

## Restore procedure

Always restore into a **new, empty database**, verify it, then swap —
never restore directly over the live `gtx_exchange` database in place.

```sh
# 1. Create a scratch database to restore into
docker compose exec -T postgres createdb -U "$POSTGRES_USER" gtx_restore_check

# 2. Restore the dump into it
docker compose exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d gtx_restore_check --no-owner \
  < /var/backups/gtx/gtx_20260101_000000.dump

# 3. Verify (row counts, spot-check recent transactions/balances) before
#    treating the dump as good.

# 4. Only after verification, and only with the app stopped, restore into
#    the real database — or point DATABASE_URL at the verified restore and
#    promote it, depending on how much downtime is acceptable.
```

Never run a restore against the live database while the app is serving
traffic — writes during a restore window can be silently lost or produce
an inconsistent state (mid-transaction balances, orphaned orders).

## Permissions

- The backup directory and dump files should be readable only by the user
  account that runs the backup job and root — dumps contain full user PII
  (email, KYC document metadata) and password hashes; treat them with the
  same sensitivity as the live database.
- The off-box copy destination must use its own credentials, not reuse the
  VPS's own SSH/deploy key, so a compromise of one doesn't hand over both
  the live system and every historical backup.
- `POSTGRES_USER`/`POSTGRES_PASSWORD` used for `pg_dump`/`pg_restore` above
  come from the same `.env` the app itself uses (see `.env.example`) — never
  hardcode them into a cron script or commit them anywhere.

## Explicitly out of scope here

No backup job has been installed, no restore has been performed or tested
against this project's actual data, and the existing Docker volumes/data
are untouched. This file only specifies the plan to implement before
production traffic exists.
