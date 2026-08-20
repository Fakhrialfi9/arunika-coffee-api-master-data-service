# Master Data Database Foundation

## Step 28 — Status

**PASS**

The Master Data Service owns the `arunika_coffee_master_data` database. Database access is isolated behind `PrismaService` in Infrastructure and uses Prisma 7 with the MariaDB adapter, matching the Users Service implementation pattern.

## Database Contract

The database contract contains these application tables:

```text
countries
regions
organizations
farmers
farms
species
varieties
processing_methods
coffee_grades
harvest_seasons
flavor_profiles
sensory_profiles
sensory_profile_flavors
certifications
coffee_beans
```

Prisma also maintains `_prisma_migrations` for migration history.

The schema and migration must preserve the existing primary keys, unique constraints, foreign-key relationships, indexes, nullability, defaults, `isActive`, `sortOrder`, and timestamp behavior. The database is the source of truth; later application layers must adapt to it rather than redesign it.

## Connection Boundary

`prisma.config.ts` resolves `DATABASE_URL` as the Prisma datasource. The runtime `PrismaService` parses that URL and creates `PrismaMariaDb` with the configured host, port, credentials, database, and pool settings.

Required runtime settings:

- `DATABASE_URL`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_POOL_CONNECTION_LIMIT`
- `DATABASE_CONNECT_TIMEOUT_MS`
- `DATABASE_ACQUIRE_TIMEOUT_MS`
- `DATABASE_POOL_IDLE_TIMEOUT_SEC`

`PrismaService.onModuleInit()` establishes the connection and executes `SELECT 1`. `onApplicationShutdown()` disconnects the Prisma client cleanly.

## Pooling

The MariaDB adapter uses the following environment-driven pool controls:

| Setting | Development default | Test default |
| --- | ---: | ---: |
| `DATABASE_POOL_CONNECTION_LIMIT` | `10` | `5` |
| `DATABASE_CONNECT_TIMEOUT_MS` | `5000` | `5000` |
| `DATABASE_ACQUIRE_TIMEOUT_MS` | `10000` | `10000` |
| `DATABASE_POOL_IDLE_TIMEOUT_SEC` | `300` | `60` |

No new connection abstraction is introduced; the implementation follows the existing Users Service `PrismaService` pattern.

## Migration Foundation

Migration files live under `prisma/migrations`. The current baseline migration is:

```text
20260819152042_new_master_data
```

Prisma 7 configuration keeps the schema source under `prisma/schema` and migration history under `prisma/migrations`.

Use:

```bash
npx prisma validate
npm run prisma:generate
npm run prisma:status
```

For a new development database, apply the committed migration with:

```bash
npm run prisma:deploy
```

`prisma migrate dev` is reserved for intentional schema-development changes and must not be used to redesign the database contract during later roadmap steps.

## Runtime Verification

The E2E database-foundation test verifies that:

1. `DATABASE_URL` is present and points to the configured database.
2. Prisma can establish a real connection.
3. `SELECT DATABASE()` resolves to the configured database.
4. All expected Master Data tables exist.
5. `_prisma_migrations` exists and contains an applied migration.

Run it with:

```bash
npm run test:e2e
```

A complete Step 28 verification should also include:

```bash
npm ci
npx prisma validate
npm run prisma:generate
npm run prisma:status
npm run test:e2e
npm run format:check
npm run lint
npm run typecheck
npm run build
```

## Ownership Rule

Only Master Data Service may access `arunika_coffee_master_data` directly. Main/API Gateway and other services must use the Master Data gRPC boundary and must not connect to this database.

## Scope Guardrail

Step 28 establishes and verifies the database foundation only. Geography, farmer/farm, taxonomy, processing, certification, packaging, export format, flavor, product master, repository, domain, CRUD, query, validation, gRPC CRUD, and later hardening remain in their respective roadmap steps.
