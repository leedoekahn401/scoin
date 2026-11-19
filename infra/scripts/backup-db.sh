#!/usr/bin/env bash
# Nightly pg_dump (NFR-REL-04). Run from cron, e.g.:
#   0 2 * * * /opt/schoolcoin/infra/scripts/backup-db.sh
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/schoolcoin}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/schoolcoin-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip > "$file"
find "$BACKUP_DIR" -name 'schoolcoin-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup written to $file"
