#!/bin/sh
# Entrypoint for the NestJS backend container.
#
# Before the app starts it applies the on-disk Prisma migrations with
# `prisma db migrate`. The command is idempotent: on an up-to-date database it
# reports "Already up to date" and exits successfully.
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL is not set" >&2
  exit 1
fi

PRISMA_BIN="${PRISMA_BIN:-/app/node_modules/.bin/prisma}"
MAX_ATTEMPTS="${DB_INIT_MAX_ATTEMPTS:-15}"

echo "[entrypoint] Applying database migrations with 'prisma db migrate'..."
attempt=1
until "$PRISMA_BIN" db migrate; do
  if [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
    echo "[entrypoint] Database is still not reachable after $attempt attempts" >&2
    exit 1
  fi
  echo "[entrypoint] Attempt $attempt/$MAX_ATTEMPTS failed, retrying in 3s..."
  attempt=$((attempt + 1))
  sleep 3
done

echo "[entrypoint] Starting: $*"
exec "$@"
