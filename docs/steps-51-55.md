# Steps 51–55 — Master Data Persistence Semantics

## Step 51 — Coffee Bean Relationship Graph

`CoffeeBean` is the central coffee entity. Its database-backed relationships are:

- `regionId` → `regions.id` (required)
- `farmerId` → `farmers.id` (optional)
- `farmId` → `farms.id` (optional)
- `speciesId` → `species.id` (required)
- `varietyId` → `varieties.id` (optional)
- `processingMethodId` → `processing_methods.id` (required)
- `gradeId` → `coffee_grades.id` (optional)
- `harvestSeasonId` → `harvest_seasons.id` (optional)
- `sensory_profiles.coffeeBeanId` → `coffee_beans.id` (one-to-one, database unique constraint)

The database FK contract is authoritative. The application additionally validates the semantic dependency that a supplied `varietyId` belongs to the supplied `speciesId`; no composite FK is introduced for this rule.

## Step 52 — Coffee Bean Quality & Inventory

Database types and nullability remain unchanged:

| Field | DB type | Nullable | Default |
| --- | --- | --- | --- |
| `cuppingScore` | `DOUBLE` | yes | null |
| `moisture` | `DOUBLE` | yes | null |
| `density` | `DOUBLE` | yes | null |
| `beanSize` | `VARCHAR(191)` | yes | null |
| `qualityStatus` | `VARCHAR(191)` | yes | null |
| `availableWeight` | `DOUBLE` | yes | null |
| `reservedWeight` | `DOUBLE` | yes | null |
| `weightUnit` | `VARCHAR(191)` | no | `kg` |

No arbitrary score/moisture/density range is inferred from the database schema. `qualityStatus` remains string/varchar semantics. Inventory quantities are non-negative domain data, and the reserved quantity must not exceed available inventory when both quantities are populated and the invariant is applicable.

## Step 53 — Lifecycle

The 14 lifecycle-managed master entities use `isActive`, `sortOrder`, `createdAt`, and `updatedAt`. The relationship table `sensory_profile_flavors` intentionally follows its database contract and exposes `sortOrder`, `createdAt`, and `updatedAt`, but does not expose `isActive`.

Lifecycle behavior is represented by changing `isActive` only on entities that actually have that database column. Repository/application filtering of inactive records is an explicit query concern, not an implicit global filter.

## Step 54 — Prisma Schema Architecture

Prisma uses a composed schema under `prisma/schema` with `prisma.config.ts` as the Prisma 7 configuration boundary. Model/field names follow the existing database names, and `@@map` is used where the Prisma model name differs from the table name. JSON fields remain Prisma `Json?` values.

Relation behavior follows the existing database FK contract. No destructive migration is introduced by Steps 51–55.

## Step 55 — Prisma / Repository Layer

Persistence is isolated under `src/infrastructure/database`:

- `PrismaService` owns Prisma client lifecycle.
- `PrismaTransactionService` owns transaction boundaries.
- `PrismaBaseRepository` centralizes persistence error translation.
- Entity-specific Prisma repositories encapsulate database delegates.
- Prisma errors are translated to repository-level unique, foreign-key, not-found, and persistence errors.
- JSON values are passed through without domain-unaware serialization changes.

Repository code does not create cross-service database access. Domain/application layers do not receive a raw Prisma client through the repository abstraction.

The verification gate is `npm run test:steps:51-55` and is read-only with respect to schema/data.