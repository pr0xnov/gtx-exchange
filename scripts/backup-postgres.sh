#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# GTX Exchange — PostgreSQL backup script.
#
# Implements the plan documented in docs/backup.md. Run this FROM THE VPS
# HOST (never from inside a container that a rebuild/recreate could wipe),
# in the project directory (where docker-compose.yml lives) or with
# PROJECT_DIR/ENV_FILE pointed at it explicitly.
#
#   ./scripts/backup-postgres.sh
#
# This script does NOT install a cron job or systemd timer itself, and
# does NOT run automatically — see scripts/systemd/ (or the cron
# alternative documented there) for how to schedule it once a VPS exists.
# It also never runs against the local dev database as a side effect of
# existing in this repo; it only does anything when explicitly invoked.
#
# Credentials come from the project's own .env (the same POSTGRES_USER/
# POSTGRES_PASSWORD/POSTGRES_DB docker-compose.yml already uses) — never
# hardcoded here, never passed as a command-line argument (those are
# visible to any local user via `ps aux`).
# ---------------------------------------------------------------------------

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_DIR/docker-compose.yml}"
BACKUP_DIR="${GTX_BACKUP_DIR:-/var/backups/gtx}"

# Retention (docs/backup.md's own numbers): keep everything for 48h, then
# thin to roughly one-per-day for 30 days, then one-per-week for a further
# 90 days. Implemented as a simple age-based prune below, not a real
# grandfather-father-son scheme — good enough for a single-instance
# deployment, and easy to audit by reading this file.
RETENTION_HOURLY_HOURS=48
RETENTION_DAILY_DAYS=30
RETENTION_WEEKLY_DAYS=90

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Set ENV_FILE=/path/to/.env or run this from the project directory." >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: $COMPOSE_FILE not found. Set COMPOSE_FILE=/path/to/docker-compose.yml." >&2
  exit 1
fi

# Load only the three vars this script actually needs, rather than
# sourcing the whole .env into the shell (which would also export every
# JWT/SMTP secret in there into this process's environment for no reason).
POSTGRES_USER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
POSTGRES_DB="$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

: "${POSTGRES_USER:?POSTGRES_USER not set in $ENV_FILE}"
: "${POSTGRES_DB:?POSTGRES_DB not set in $ENV_FILE}"

# pg_dump runs *inside* the postgres container, connecting over its own
# local Unix socket — the official postgres image trusts that local
# connection without a password (see its default pg_hba.conf), the same
# way docs/backup.md's own example command already relied on. No password
# needs to leave the container, cross the docker exec boundary, or appear
# in this script at all.
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
DUMP_FILE="$BACKUP_DIR/gtx_${TIMESTAMP}.dump"
TMP_FILE="${DUMP_FILE}.partial"

echo "[backup] $(date -u +%FT%TZ) starting pg_dump of '${POSTGRES_DB}' -> ${DUMP_FILE}"

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  > "$TMP_FILE"

# Atomic-ish: only becomes the "real" dump file once pg_dump has fully
# succeeded, so a crashed/killed run never leaves a truncated file that
# looks like a valid backup.
mv "$TMP_FILE" "$DUMP_FILE"
chmod 600 "$DUMP_FILE"

echo "[backup] done: $(du -h "$DUMP_FILE" | cut -f1) written."

# --- Retention: prune dumps older than the longest window ------------------
# Anything older than RETENTION_WEEKLY_DAYS is deleted outright. Between
# the hourly and weekly windows, this intentionally keeps things simple
# (age-based, not a real thinning schedule) — tune here if disk cost ever
# becomes a real constraint; today's priority (per docs/backup.md) is
# "don't lose financial data", not minimizing dump count.
find "$BACKUP_DIR" -maxdepth 1 -name 'gtx_*.dump' -type f \
  -mtime "+${RETENTION_WEEKLY_DAYS}" -print -delete

echo "[backup] retention: pruned dumps older than ${RETENTION_WEEKLY_DAYS} days."
echo "[backup] complete."
