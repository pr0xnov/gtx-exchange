# PostgreSQL backup & restore

GTX holds real financial state (balances, deposits, withdrawals, orders) in
a single Postgres instance with no replica. Before real users touch this
deployment, a backup job must be running.

**Status: the script and schedule are prepared (`scripts/backup-postgres.sh`,
`scripts/verify-backup-restore.sh`, `scripts/systemd/gtx-backup.{service,timer}`),
but nothing is installed on any VPS yet — there is no VPS yet.** This
document is both the plan and the installation instructions for whenever
one exists.

## Backup command

`scripts/backup-postgres.sh` implements this — timestamped output filename,
retention pruning, and safe (600/700) permissions included. Run it by hand
once to confirm it works before relying on the schedule below:

```sh
./scripts/backup-postgres.sh
```

Underneath, it runs (from the Docker host, against the running `postgres`
container):

```sh
docker compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  > "/var/backups/gtx/gtx_$(date -u +%Y%m%d_%H%M%S).dump"
```

- `--format=custom` (not plain SQL) so `pg_restore` can do a selective or
  parallel restore later, and so the dump is compressed by default.
- Credentials are read from the project's own `.env` (`POSTGRES_USER`/
  `POSTGRES_DB`) — never hardcoded in the script, never passed on the
  command line. `pg_dump` runs _inside_ the postgres container over its
  own local socket, which the official image already trusts without a
  password — no secret ever crosses the `docker exec` boundary.
- Run this on a schedule (cron / systemd timer) — e.g. every 6 hours — from
  the VPS host, not from inside a container that gets recreated on deploy.

## Installing the schedule (once a VPS exists)

**systemd timer (recommended)** — see `scripts/systemd/gtx-backup.service`
and `scripts/systemd/gtx-backup.timer` for the actual units and their own
install steps. In short:

```sh
sudo cp scripts/systemd/gtx-backup.{service,timer} /etc/systemd/system/
# edit WorkingDirectory/ExecStart in the .service to the real deploy path
sudo systemctl daemon-reload
sudo systemctl enable --now gtx-backup.timer
sudo systemctl list-timers gtx-backup.timer   # confirm it's scheduled
```

**cron (alternative)**, if this VPS doesn't use systemd timers for other
jobs and you'd rather keep everything in one crontab:

```cron
# /etc/cron.d/gtx-backup — every 6 hours
0 */6 * * * root cd /opt/gtx-exchange && ./scripts/backup-postgres.sh >> /var/log/gtx-backup.log 2>&1
```

Neither of these is installed by this repository — this section is
instructions for the VPS setup step, not something that runs today.

## Verifying a backup

A backup nobody has ever restored is not a backup. `scripts/verify-backup-restore.sh`
restores the newest (or a given) dump into a throwaway `gtx_restore_check`
database on the same instance, prints row counts, and drops it again —
never touches the real database:

```sh
./scripts/verify-backup-restore.sh                      # newest dump
./scripts/verify-backup-restore.sh /var/backups/gtx/gtx_20260101_000000.dump
```

Run this right after the first real backup, and periodically afterward
(e.g. weekly) — separately from the scheduled backup job itself.

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
# 1-3. Create a scratch database, restore the dump into it, and print row
#      counts — `scripts/verify-backup-restore.sh` does exactly this (see
#      "Verifying a backup" above). Equivalent by hand:
docker compose exec -T postgres createdb -U "$POSTGRES_USER" gtx_restore_check
docker compose exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d gtx_restore_check --no-owner \
  < /var/backups/gtx/gtx_20260101_000000.dump
# Then spot-check recent transactions/balances by hand before treating the
# dump as good — row counts alone don't catch every possible corruption.

# 4. Only after verification, and only with the app stopped, restore into
#    the real database — or point DATABASE_URL at the verified restore and
#    promote it, depending on how much downtime is acceptable. Deliberately
#    NOT scripted: promoting a restore over the live database is a judgment
#    call (which dump, how much downtime, has anyone confirmed data since
#    the dump is an acceptable loss) that shouldn't be one command away.
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

The script, verification tool, and systemd units exist (see above) but
**nothing is scheduled or installed on any machine** — there is no VPS
yet. No restore has been performed or tested against this project's
actual production data (only exercised against a disposable scratch
database, by design). The existing local development Docker volumes/data
are untouched by any of this. This file is the plan and the installation
steps to follow once a VPS exists, not a record of something already done.
