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

pass_step() {
  printf 'PASS: Step %s — %s\n' "$1" "$2"
}

# STEP 81 — Error Handling
require_file src/presentation/grpc/filters/master-data.grpc-exception.filter.ts
require_file src/infrastructure/database/errors/repository.error.ts
run grep -q "status.NOT_FOUND" src/presentation/grpc/filters/master-data.grpc-exception.filter.ts
run grep -q "status.INVALID_ARGUMENT" src/presentation/grpc/filters/master-data.grpc-exception.filter.ts
run grep -q "status.ALREADY_EXISTS" src/presentation/grpc/filters/master-data.grpc-exception.filter.ts
run grep -q "status.FAILED_PRECONDITION" src/presentation/grpc/filters/master-data.grpc-exception.filter.ts
run grep -q "status.INTERNAL" src/presentation/grpc/filters/master-data.grpc-exception.filter.ts
run grep -q "Internal server error" src/presentation/grpc/filters/master-data.grpc-exception.filter.ts
pass_step 81 "Error translation and safe gRPC status mapping are present."

# STEP 82 — Observability
require_file src/presentation/grpc/interceptors/grpc-observability.interceptor.ts
require_file src/observability/opentelemetry-lifecycle.service.ts
run grep -q "x-request-id" src/presentation/grpc/interceptors/grpc-observability.interceptor.ts
run grep -q "grpc.server.requests" src/presentation/grpc/interceptors/grpc-observability.interceptor.ts
run grep -q "grpc.server.duration_ms" src/presentation/grpc/interceptors/grpc-observability.interceptor.ts
run grep -q "NodeSDK" src/observability/opentelemetry-lifecycle.service.ts
pass_step 82 "Structured request logging, correlation, metrics instrumentation, and OTEL lifecycle are present."

# STEP 83 — Health & Readiness
require_file src/presentation/grpc/health/grpc-health.service.ts
require_file src/infrastructure/database/database-health.service.ts
run grep -q "LIVENESS" src/presentation/grpc/health/grpc-health.service.ts
run grep -q "READINESS" src/presentation/grpc/health/grpc-health.service.ts
run grep -q "Promise.race" src/infrastructure/database/database-health.service.ts
pass_step 83 "Liveness/readiness and bounded database health checks are present."

# STEP 84 — Graceful Shutdown
run grep -q "enableShutdownHooks(\['SIGINT', 'SIGTERM'\]\)" src/main.ts
run grep -q "onApplicationShutdown" src/infrastructure/database/prisma.service.ts
run grep -q "onApplicationShutdown" src/presentation/grpc/health/grpc-health.service.ts
pass_step 84 "SIGINT/SIGTERM hooks and Prisma/gRPC health lifecycle cleanup are present."

# STEP 85 — Configuration Hardening
require_file .env.example
require_file .env.test.example
require_file .env.production.example
run grep -q "DATABASE_URL" src/config/env.validation.ts
run grep -q "DATABASE_URL database name must match DATABASE_NAME" src/config/env.validation.ts
run grep -q "must use a strong production secret" src/config/env.validation.ts
run grep -q "OTEL_TRACES_SAMPLER_ARG" src/config/env.validation.ts
pass_step 85 "Environment validation and production hardening rules are present."

# STEP 86 — Docker / Production Runtime
require_file Dockerfile
require_file scripts/docker-healthcheck.mjs
run grep -q "FROM node:22-bookworm-slim AS builder" Dockerfile
run grep -q "FROM node:22-bookworm-slim AS runtime" Dockerfile
run grep -q "USER node" Dockerfile
run grep -q "HEALTHCHECK" Dockerfile
run grep -q "npm ci --omit=dev" Dockerfile
if grep -q '^ENV .*PASSWORD\|^ENV .*DATABASE_URL=.*<' Dockerfile; then
  echo 'BLOCKER: Dockerfile contains a secret-like runtime value' >&2
  exit 1
fi
pass_step 86 "Multi-stage non-root production image and gRPC healthcheck are present."

# STEP 87 — Deployment Readiness
require_file docs/deployment.md
run grep -q "prisma migrate deploy" docs/deployment.md
run grep -q "must not run the seed automatically" docs/deployment.md
run grep -q "readiness" docs/deployment.md
pass_step 87 "Migration, seed, startup, readiness, and shutdown strategy is documented."

# STEP 88 — Documentation Audit
require_file README.md
require_file docs/grpc.md
require_file docs/deployment.md
require_file docs/configuration.md
require_file docs/observability.md
run grep -q "arunika_coffee_master_data" README.md
run grep -q "50053" README.md
run grep -q "liveness" README.md
pass_step 88 "Primary runtime, gRPC, deployment, configuration, and observability documentation exists."

# STEP 89 — Consumer Readiness
# This is deliberately strict. The current repository's protobuf exposes only GetHealth,
# while the roadmap acceptance requires CRUD, relationship, filtering/pagination, and error
# contract coverage. Do not report a false PASS.
PROTO="proto/master-data/v1/master-data.proto"
require_file "$PROTO"
for rpc in CreateMasterData GetMasterData ListMasterData UpdateMasterData DeleteMasterData GetRelationship; do
  if ! grep -Eq "rpc ${rpc}\\(" "$PROTO"; then
    echo "BLOCKER: Step 89 is not PASS: missing required RPC ${rpc} in ${PROTO}" >&2
    exit 1
  fi
done
pass_step 89 "Master Data gRPC consumer contract contains the required RPC surface."

# STEP 90 — Full Regression
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

pass_step 90 "Full regression, quality gates, and Docker build completed successfully."
printf '\nPASS: Steps 81-90 verification completed.\n'
