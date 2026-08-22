# Arunika Coffee API — Master Data Service

NestJS 11 / TypeScript microservice that owns the `arunika_coffee_master_data` MySQL database and exposes its transport boundary through gRPC.

## Architecture

```text
Client
  |
  v
Main / API Gateway
  |
  | gRPC
  v
Master Data Service
  |
  v
arunika_coffee_master_data
```

The Master Data Service is the only owner of its database. Main and Users Service must never connect to this database directly.

## Runtime

- Node.js: 22.x
- Package manager: npm 11.18.0
- Database: MySQL
- Prisma: 7.9.1
- gRPC port: `50053` by default
- gRPC package: `arunika.coffee.master_data.v1`

## Setup

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

Use `npm run prisma:migrate` only for development migration work. Production uses `npm run prisma:deploy`.

## Development

```bash
npm run start:dev
```

## Quality gates

```bash
npm run prisma:generate
npx prisma validate
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:grpc
npm run test:security
npm run build
```

Full existing regression suite:

```bash
npm run test:all
```

## Docker

```bash
docker build -t arunika-coffee-master-data-service:latest .
```

The production image uses Node 22, a multi-stage build, production dependencies only, a non-root `node` user, and the gRPC healthcheck. Runtime secrets are supplied through environment variables and are not copied into the image.

## Configuration

Development, test, and production examples are provided as:

- `.env.example`
- `.env.test.example`
- `.env.production.example`

Production rejects local database hosts, weak credentials, local CORS origins, development log levels, and invalid database URLs.

## Health

The standard gRPC health service exposes:

- `liveness` — process/server health; independent of MySQL.
- `readiness` — database dependency health.
- `arunika.coffee.master_data.v1.MasterDataService` — follows readiness.

The container healthcheck checks `liveness`.

## Observability

Structured JSON logs include service/RPC events and a correlation `x-request-id`. Incoming valid request IDs are reused; otherwise one is generated. Error responses include the correlation ID without exposing database or stack-trace details.

OpenTelemetry SDK/auto-instrumentation is lifecycle-managed and controlled by the `OTEL_*` environment settings. Metrics/tracing remain outside business logic.

## Documentation

- `docs/architecture.md`
- `docs/database.md`
- `docs/geography.md`
- `docs/farmer-farm.md`
- `docs/organization.md`
- `docs/deployment.md`
- `docs/grpc.md`

## Verification

The step-specific verification scripts live under `scripts/verify/`.

```bash
bash scripts/verify/steps-81-90.sh
```

The verifier intentionally fails when the repository contains a known blocker instead of reporting a false PASS.

## Current gRPC compatibility note

The repository currently contains a health-only `master-data.proto`. The application/domain CRUD and relationship services exist, but the full CRUD/relationship gRPC contract required by the earlier Step 71–75 acceptance criteria is not currently exposed by the gRPC controller. This is a known blocker for Step 89 and therefore Step 90 cannot honestly be marked PASS until the contract is completed and regression-tested.
