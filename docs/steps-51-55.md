# Steps 51–55 — Master Data Persistence Semantics

## Step 51 — Coffee Bean Relationship Graph

`CoffeeBean` is the central coffee entity. Its database-backed relationships are:

- `regionId` → `regions.id` (required, `RESTRICT` on delete)
- `farmerId` → `farmers.id` (optional, `SET NULL` on delete)
- `farmId` → `farms.id` (optional, `SET NULL` on delete)
- `speciesId` → `species.id` (required, `RESTRICT` on delete)
- `varietyId` → `varieties.id` (optional, `SET NULL` on delete)
- `processingMethodId` → `processing_methods.id` (required, `RESTRICT` on delete)
- `gradeId` → `coffee_grades.id` (optional, `SET NULL` on delete)
- `harvestSeasonId` → `harvest_seasons.id` (optional, `SET NULL` on delete)
- `sensory_profiles.coffeeBeanId` → `coffee_beans.id` (one-to-one, database unique constraint)

The database FK contract is authoritative. The application must additionally validate the semantic dependency that a supplied `varietyId` belongs to the same `speciesId`; no composite FK is introduced for this rule.

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

No arbitrary score/moisture/density range is inferred from the database schema. `qualityStatus` remains string/varchar semantics. Inventory quantities are non-negative domain data, and the reserved quantity must not exceed available inventory when both quantities are populated and the business invariant is applicable.

## Step 53 — Lifecycle

All 14 master-data tables use `isActive`, `sortOrder`, `createdAt`, and `updatedAt`. There is no `deletedAt` field in the database contract.

`isActive = false` means the row remains persisted but is inactive; it is not a soft-delete marker. Deactivation/reactivation is represented by changing `isActive`. Repository/application filtering of inactive records is an explicit query concern, not an implicit global filter.

## Step 54 — Prisma Schema Architecture

Prisma uses a composed schema under `prisma/schema` with `prisma.config.ts` as the Prisma 7 configuration boundary. Model/field names follow the existing database names, and `@@map` is used where the Prisma model name differs from the table name. JSON fields remain Prisma `Json?` values.

Relation delete/update behavior follows the existing database FK contract. No destructive migration is introduced by Steps 51–55.

## Step 55 — Prisma / Repository Layer

Persistence is isolated under `src/infrastructure/database`:

- `PrismaService` owns Prisma client lifecycle.
- `PrismaTransactionService` owns transaction boundaries.
- `PrismaBaseRepository` centralizes persistence error translation.
- Entity-specific Prisma repositories encapsulate database delegates.
- Prisma errors are translated to repository-level unique, foreign-key, not-found, and persistence errors.
- JSON values are passed through without domain-unaware serialization changes.

Repository code does not create cross-service database access. Domain/application layers do not receive a raw Prisma client through the repository abstraction.

The verification gate is `npm run test:steps:51-55` and is intentionally read-only with respect to schema/data.
