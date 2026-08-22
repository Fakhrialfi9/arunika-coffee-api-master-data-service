#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

log() { printf '\n[steps-76-80] %s\n' "$1"; }

: "${DATABASE_URL:?DATABASE_URL must be set to the isolated MySQL test database}"
case "$DATABASE_URL" in
  *arunika_coffee_master_data_test*) ;;
  *)
    echo "ERROR: DATABASE_URL must target arunika_coffee_master_data_test" >&2
    exit 1
    ;;
esac

export NODE_ENV=test

log "Database target: $DATABASE_URL"

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
