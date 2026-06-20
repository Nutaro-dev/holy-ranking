#!/bin/sh
set -e

# Deprecated: Holy Ranking SQL now mounts directly into
# /docker-entrypoint-initdb.d/migrations/ as numbered files.
# Kept for reference/manual runs only.

for f in /docker-entrypoint-initdb.d/migrations/*holy-ranking*.sql; do
  if [ -f "$f" ]; then
    echo "Running migration: $f"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$f"
  fi
done
