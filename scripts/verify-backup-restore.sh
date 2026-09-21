#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# GTX Exchange — backup verification (restore-test) script.
#
# Restores the most recent (or explicitly given) dump into a throwaway
# scratch database on the SAME postgres instance, reports basic row
# counts, then drops the scratch database again. Never touches the real
# database — this is a read-only sanity check that a backup file is
# actually restorable, per docs/backup.md's "Restore procedure" section.
#
# Usage:
#   ./scripts/verify-backup-restore.sh                     # verifies the newest dump in GTX_BACKUP_DIR
#   ./scripts/verify-backup-restore.sh /path/to/gtx_X.dump # verifies a specific dump
#
# Run this periodically (e.g. weekly, or right after backup-postgres.sh)
# — a backup nobody has ever successfully restored is not a backup, it's
# a hope.
# ---------------------------------------------------------------------------

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_DIR/docker-compose.yml}"
BACKUP_DIR="${GTX_BACKUP_DIR:-/var/backups/gtx}"
SCRATCH_DB="gtx_restore_check"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Set ENV_FILE=/path/to/.env or run this from the project directory." >&2
  exit 1
fi

POSTGRES_USER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
: "${POSTGRES_USER:?POSTGRES_USER not set in $ENV_FILE}"

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ]; then
  DUMP_FILE="$(find "$BACKUP_DIR" -maxdepth 1 -name 'gtx_*.dump' -type f -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | head -1 | cut -d' ' -f2-)"
fi
if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "ERROR: no dump file found (looked in $BACKUP_DIR, or pass a path explicitly)." >&2
  exit 1
fi

echo "[verify] using dump: $DUMP_FILE"

compose() { docker compose -f "$COMPOSE_FILE" exec -T postgres "$@"; }

# Fresh scratch DB every run — never restore over an existing one.
compose dropdb -U "$POSTGRES_USER" --if-exists "$SCRATCH_DB"
compose createdb -U "$POSTGRES_USER" "$SCRATCH_DB"

echo "[verify] restoring into scratch database '$SCRATCH_DB'…"
compose pg_restore -U "$POSTGRES_USER" -d "$SCRATCH_DB" --no-owner < "$DUMP_FILE"

echo "[verify] row counts in the restored copy:"
compose psql -U "$POSTGRES_USER" -d "$SCRATCH_DB" -c "
  SELECT relname AS table_name, n_live_tup AS approx_rows
  FROM pg_stat_user_tables
  ORDER BY relname;
"

echo "[verify] cleaning up scratch database…"
compose dropdb -U "$POSTGRES_USER" "$SCRATCH_DB"

echo "[verify] OK — dump restored successfully and was inspected. This does NOT replace"
echo "[verify] an occasional manual spot-check of actual balances/recent transactions."
