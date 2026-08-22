# Deployment

## Runtime contract

- Node.js: 22.x
- Runtime entrypoint: `node dist/src/main.js`
- Transport: gRPC
- Default gRPC port: `50053`
- Database: MySQL, database `arunika_coffee_master_data`
- Database owner: Master Data Service
- Cross-service database access is not allowed.

## Production startup

1. Provide all required environment variables from `.env.production.example` using real deployment secrets.
2. Build the production image with `docker build -t arunika-coffee-master-data-service:latest .`.
3. Apply committed migrations with `npm run prisma:deploy` (or the equivalent release-job command) before marking the service ready.
4. Start the container with the production environment.
5. The container liveness healthcheck calls the gRPC health service.
6. Readiness is `SERVING` only while the database health check succeeds.

Do not run `prisma migrate dev` in production.

## Migration and seed strategy

`prisma migrate deploy` is the production migration command. It applies committed migrations and fails the release when a migration cannot be applied.

Seeding is deterministic and idempotent through `npm run prisma:seed`, but it is a development/test operation by default. Production deployments must not run the seed automatically unless the deployment contract explicitly requires reference-data seeding.

## Startup ordering

Database availability is a readiness dependency. The process can be alive while readiness is `NOT_SERVING`; deployment systems should route traffic only after readiness reports `SERVING`.

The gRPC server exposes standard gRPC health statuses for `liveness`, `readiness`, and the versioned Master Data service name.

## Shutdown

NestJS shutdown hooks handle `SIGINT` and `SIGTERM`. The health service immediately marks the service not ready/not live and stops its polling timer. Prisma disconnects through its application shutdown hook. Container termination therefore uses the normal NestJS lifecycle instead of abruptly killing the process.

## Secrets

Never commit `.env` files or production credentials. `.dockerignore` excludes environment files from the image build context.
