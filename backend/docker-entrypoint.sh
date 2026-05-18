#!/bin/sh
set -e
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  goose -dir /app/migrations postgres "$DATABASE_URL" up
fi
exec /app/server
