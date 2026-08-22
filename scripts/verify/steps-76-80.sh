#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

log() { printf '\n[steps-76-80] %s\n' "$1"; }

# The verification script must be runnable from a normal local checkout without
# requiring the caller to manually export DATABASE_URL first. Prefer an explicit
# environment variable, then load DATABASE_URL from the local .env.test/.env file.
# Never fall back to the development/production database: the validation below
# requires the isolated *_test database before any Prisma command is executed.
if [[ -z "${DATABASE_URL:-}" ]]; then
  for env_file in .env.test .env; do
    if [[ -f "$env_file" ]]; then
      env_database_url="$(awk -F= '/^[[:space:]]*DATABASE_URL[[:space:]]*=/{value=$0; sub(/^[^=]*=/, "", value); gsub(/^\"|\"$/, "", value); gsub(/^\x27|\x27$/, "", value); print value}' "$env_file" | tail -n 1)"
      if [[ -n "$env_database_url" ]]; then
        export DATABASE_URL="$env_database_url"
        break
      fi
    fi
  done
fi

: "${DATABASE_URL:?DATABASE_URL must be set to the isolated MySQL test database (export it or define DATABASE_URL in .env.test/.env)}"
case "$DATABASE_URL" in
  *arunika_coffee_master_data_test*) ;;
  *)
    echo "ERROR: DATABASE_URL must target arunika_coffee_master_data_test" >&2
    exit 1
    ;;
esac

export NODE_ENV=test

# Never print DATABASE_URL verbatim because it may contain database credentials.
masked_database_url="$(node --input-type=module -e '
const url = new URL(process.env.DATABASE_URL);
url.username = "***";
url.password = "***";
console.log(url.toString());
')"

log "Database target: $masked_database_url"

log "Prisma schema validation"
npx prisma validate

log "Prisma client generation"
npm run prisma:generate

log "Step 78: deploy all migrations to the isolated test database"
npm run prisma:deploy

log "Step 78: seed the isolated test database"
npm run prisma:seed

log "Step 76: unit tests"
npm run test:unit

log "Step 77-78: real MySQL integration tests"
npm run test:integration

log "Step 79: Master Data E2E tests"
npm run test:e2e

log "gRPC regression tests"
npm run test:grpc

log "Step 80: security tests"
npm run test:security

log "Static quality gates"
npm run lint
npm run typecheck
npm run format:check
npm run build

log "PASS: Steps 76-80 validation gates completed"
