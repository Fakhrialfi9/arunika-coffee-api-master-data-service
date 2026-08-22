#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

run() {
  printf '\n==> %s\n' "$*"
  "$@"
}

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "BLOCKER: required file not found: $1" >&2
    exit 1
  fi
}

fail_if_match() {
  local pattern="$1"
  shift
  if grep -REn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage "$pattern" "$@"; then
    echo "BLOCKER: forbidden pattern matched: $pattern" >&2
    exit 1
  fi
}

pass_step() {
  printf 'PASS: Step %s — %s\n' "$1" "$2"
}

printf 'PHASE 2 — Master Data Service — Steps 90-93 verification\n'
printf 'Repository: %s\n' "$ROOT_DIR"
printf 'Branch: '
git branch --show-current

# STEP 90 — Regression baseline
require_file scripts/verify/steps-81-90.sh
run npx prisma validate
run npm run prisma:generate
run npm run format:check
run npm run lint
run npm run typecheck
run npm run test:unit
run npm run test:integration
run npm run test:e2e
run npm run test:grpc
run npm run test:security
run npm run build

if command -v docker >/dev/null 2>&1; then
  run docker build -t arunika-coffee-master-data-service:verify .
else
  echo 'BLOCKER: Docker CLI is required for Step 90 validation.' >&2
  exit 1
fi

pass_step 90 'Regression, quality gates, tests, build, and Docker validation completed.'

# STEP 91 — Code Quality Gate
require_file package.json
require_file package-lock.json
require_file eslint.config.mjs
require_file .prettierrc
require_file tsconfig.json

run npm run format:check
run npm run lint
run npm run typecheck
run npm run build

# No suppression/workaround may hide a quality failure.
fail_if_match '(^|[^[:alnum:]_])eslint-disable([^[:alnum:]_]|$)' src test
fail_if_match '(^|[^[:alnum:]_])ts-ignore([^[:alnum:]_]|$)' src test
fail_if_match '(^|[^[:alnum:]_])ts-nocheck([^[:alnum:]_]|$)' src test
fail_if_match '(^|[^[:alnum:]_])any([^[:alnum:]_]|$)' src test

# Empty TypeScript implementation/test files are blockers at final quality gate.
if find src test -type f -name '*.ts' -empty -print -quit | grep -q .; then
  echo 'BLOCKER: empty TypeScript implementation/test file detected.' >&2
  exit 1
fi

# TODO/FIXME are allowed only when they are not blockers; final gate treats any
# remaining marker in implementation/test code as requiring explicit cleanup.
fail_if_match '(TODO|FIXME)' src test

# Dependency audit is intentionally strict at the final quality gate.
run npm audit --audit-level=high

pass_step 91 'ESLint, Prettier, TypeScript, build, suppression, dead-code/stub, and dependency quality checks passed.'

# STEP 92 — Master Data Architecture Re-Audit
require_file docs/step-27-master-data-architecture.md
require_file docs/architecture.md
require_file src/application/master-data/master-data-application.module.ts
require_file src/domain/shared/repositories/master-data.repository.ts
require_file src/infrastructure/database/database.module.ts
require_file src/infrastructure/database/prisma.service.ts
require_file src/infrastructure/database/repositories/prisma-master-data-repository.factory.ts
require_file src/presentation/grpc/master-data.grpc.controller.ts
require_file proto/master-data/v1/master-data.proto

# Domain/application/presentation must remain persistence-agnostic.
fail_if_match '@prisma/client|PrismaClient|@prisma/' src/domain src/application src/presentation
fail_if_match '@nestjs/|@grpc/' src/domain
fail_if_match 'DATABASE_URL|DATABASE_HOST|DATABASE_USER|DATABASE_PASSWORD' src/domain src/application src/presentation

# Master Data Service must remain the only owner of its database. References to
# the Users database are prohibited in this repository.
fail_if_match 'arunika_coffee_users|DATABASE_USERS|USERS_DATABASE' . ':!package-lock.json'

# Verify the documented transport and persistence boundaries remain present.
grep -q 'Master Data Service owns all master-data persistence' docs/architecture.md
grep -q 'Other services must not connect to `arunika_coffee_master_data` directly' docs/architecture.md
grep -q 'Inter-service access is exposed through the Master Data gRPC contract' docs/architecture.md
grep -q 'Domain must not depend on NestJS, Prisma, gRPC, or database-specific types' docs/architecture.md
grep -q 'Repository interfaces are domain/application-facing contracts' docs/architecture.md

grep -q 'MASTER_DATA_REPOSITORY_FACTORY' src/domain/shared/repositories/master-data.repository.ts
grep -q 'Prisma' src/infrastructure/database/repositories/prisma-master-data-repository.factory.ts
grep -q 'MasterDataCrudUseCase' src/presentation/grpc/master-data.grpc.controller.ts

grep -q 'GetRelationship' proto/master-data/v1/master-data.proto

grep -q 'CreateMasterData' proto/master-data/v1/master-data.proto

grep -q 'ListMasterData' proto/master-data/v1/master-data.proto

grep -q 'UpdateMasterData' proto/master-data/v1/master-data.proto

grep -q 'DeleteMasterData' proto/master-data/v1/master-data.proto

run npx prisma validate
run npm run prisma:generate
run npm run prisma:status

pass_step 92 'Architecture boundaries, dependency direction, Prisma boundary, database ownership, and gRPC contract checks passed.'

# STEP 93 — Master Data Final Audit
# Database / Prisma
run npx prisma validate
run npm run prisma:generate
run npm run prisma:status

# Application quality and behavior
run npm run format:check
run npm run lint
run npm run typecheck
run npm run test:unit
run npm run test:integration
run npm run test:e2e
run npm run test:grpc
run npm run test:security
run npm run build

# Security/dependency final gate
run npm audit --audit-level=high

# Production artifact verification
if command -v docker >/dev/null 2>&1; then
  run docker build -t arunika-coffee-master-data-service:final-verify .
else
  echo 'BLOCKER: Docker CLI is required for Step 93 validation.' >&2
  exit 1
fi

# Contract and ownership assertions.
for table in \
  certifications coffee_beans coffee_grades countries farmers farms \
  flavor_profiles harvest_seasons organizations processing_methods regions \
  sensory_profile_flavors sensory_profiles species varieties; do
  if ! grep -Rqi "model.*${table}\|${table}" prisma/schema; then
    echo "BLOCKER: expected database model/table reference not found: ${table}" >&2
    exit 1
  fi
done

fail_if_match 'arunika_coffee_users|DATABASE_USERS|USERS_DATABASE' . ':!package-lock.json'
fail_if_match '@prisma/client|PrismaClient|@prisma/' src/domain src/application src/presentation

require_file README.md
require_file docs/configuration.md
require_file docs/database.md
require_file docs/grpc.md
require_file docs/deployment.md
require_file docs/observability.md
require_file Dockerfile
require_file scripts/docker-healthcheck.mjs

pass_step 93 'Database, Prisma, domain/application/repository boundaries, gRPC, tests, security, observability, Docker, and documentation final gate passed.'
printf '\nPASS: Steps 90-93 verification completed successfully.\n'
printf 'MASTER DATA SERVICE = COMPLETE\n'
