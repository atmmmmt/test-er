#!/bin/sh
set -eu
DB="${NAWAFITH_DB:-/data/nawafith_internal.sqlite3}"
if [ ! -f "$DB" ] && [ -f "${DB}.zst" ]; then
  echo "Preparing internal database..."
  zstd -d --no-progress "${DB}.zst" -o "$DB"
fi
if [ ! -f "$DB" ]; then
  echo "Database not found: $DB" >&2
  echo "Place nawafith_internal.sqlite3 or nawafith_internal.sqlite3.zst in the mounted /data directory." >&2
  exit 2
fi
exec gunicorn -w "${WEB_WORKERS:-2}" -b "0.0.0.0:${PORT:-8080}" --timeout 120 app:app
