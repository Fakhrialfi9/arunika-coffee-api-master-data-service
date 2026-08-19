# Step 01 — Master Data Foundation Audit

## Scope

This step establishes the production-oriented foundation for the Master Data Service and keeps its implementation aligned with the Users Service reference architecture.

## Service Boundary

- Service: `arunika-coffee-api-master-data-service`
- Database: `arunika_coffee_master_data`
- Internal transport: gRPC
- gRPC endpoint: `GRPC_MASTER_HOST:GRPC_MASTER_PORT`
- Database access: Prisma 7 + MariaDB adapter
- Runtime: Node.js 22 LTS
- Framework: NestJS 11

## Foundation Components

- Environment configuration and validation
- Prisma schema and generated-client configuration
- Database module and health check
- gRPC contract and health endpoint
- gRPC health/readiness monitoring
- Graceful shutdown hooks
- Docker multi-stage build
- Container health check
- Vitest unit-test configuration
- CI quality gates for format, lint, typecheck, tests, build, and Docker build

## Database Ownership

The Master Data Service owns `arunika_coffee_master_data`. The Main API Gateway must communicate with this service through gRPC and must not access this database directly.

## Quality Gate

The repository CI pipeline is configured to run:

1. `npm ci`
2. `npx prisma validate`
3. `npm run prisma:generate`
4. `npm run format:check`
5. `npm run lint`
6. `npm run typecheck`
7. `npm run test:unit`
8. `npm run build`
9. `docker build`

A Step 01 PASS requires every gate to succeed on the current `main` commit and requires runtime/integration verification of the gRPC service and database connectivity. Until those checks are observed as successful, Step 01 must remain NOT PASS.
