# Step 29 — Database Schema Inventory

## Status

**AUDIT COMPLETE — PASS against the supplied database contract and committed Prisma migration.**

> Runtime-only checks that require a live `arunika_coffee_master_data` connection (for example orphan-row detection and exact physical index metadata) must still be executed against the target database before a release gate can claim runtime PASS.

## Source of Truth

`arunika_coffee_master_data` is the database contract. The inventory below was reconciled against:

- the supplied `DESCRIBE` output for all application tables;
- Prisma models under `prisma/schema`;
- migration `20260819152042_new_master_data`.

The committed migration creates all 15 application tables and `_prisma_migrations` is maintained by Prisma.

## Table Inventory

| Table | Primary key | UUID | Unique keys | JSON | Required FK fields | Optional FK fields |
|---|---|---|---|---|---|---|
| `_prisma_migrations` | `id` | No | None | No | None | None |
| `certifications` | `id` | No | `uuid`, `code` | No | None | None |
| `coffee_beans` | `id` | No | `uuid`, `code` | `flavorProfiles`, `aromaNotes` | `regionId`, `speciesId`, `processingMethodId` | `farmerId`, `farmId`, `varietyId`, `gradeId`, `harvestSeasonId` |
| `coffee_grades` | `id` | No | `uuid`, `code` | No | None | None |
| `countries` | `id` | No | `uuid`, `code`, `iso2`, `iso3` | No | None | None |
| `farmers` | `id` | No | `uuid`, `code` | No | `regionId` | `organizationId` |
| `farms` | `id` | No | `uuid` | No | `farmerId` | None |
| `flavor_profiles` | `id` | No | `uuid`, `code` | No | None | None |
| `harvest_seasons` | `id` | No | `uuid` | No | None | None |
| `organizations` | `id` | No | `uuid`, `code` | No | `regionId` | None |
| `processing_methods` | `id` | No | `uuid`, `code` | `processingSteps`, `parameters` | None | None |
| `regions` | `id` | No | `uuid`, `code` | No | `countryId` | None |
| `sensory_profile_flavors` | `id` | No | `uuid`, `(sensoryProfileId, flavorProfileId)` | No | `sensoryProfileId`, `flavorProfileId` | None |
| `sensory_profiles` | `id` | No | `uuid`, `coffeeBeanId` | No | `coffeeBeanId` | None |
| `species` | `id` | No | `uuid`, `code` | No | None | None |
| `varieties` | `id` | No | `uuid`, `code` | `plantCharacteristics`, `flavorCharacteristics` | `speciesId` | None |

## Common Column Contract

All application tables use `VARCHAR(191)` string IDs. Primary keys are non-null. UUID columns are non-null and unique. `createdAt` is non-null with `CURRENT_TIMESTAMP(3)` as the database default, while `updatedAt` is non-null and is maintained by Prisma's `@updatedAt` behavior rather than a SQL default.

The boolean status fields use MariaDB `tinyint(1)` representation and retain the database defaults defined by the migration (`isActive=true`, with domain-specific flags such as `isFeatured`, `isCoffeeOrigin`, `exportEligible`, `fermentation`, and `isCurrent` using their committed defaults). `sortOrder` defaults to `0` where present.

Nullable fields remain nullable exactly as shown by the supplied `DESCRIBE` contract. No nullable FK was promoted to required.

## Table-Specific Defaults

- `certifications.requiresExpiration` → `false`; `isActive` → `true`; `sortOrder` → `0`.
- `coffee_beans.weightUnit` → `kg`; `isFeatured` → `false`; `isActive` → `true`; `sortOrder` → `0`.
- `coffee_grades.exportEligible` → `false`; `isActive` → `true`; `sortOrder` → `0`.
- `countries.isCoffeeOrigin` → `false`; `isActive` → `true`; `sortOrder` → `0`.
- `farms.areaUnit` → `hectare`; `altitudeUnit` → `MASL`; `isActive` → `true`; `sortOrder` → `0`.
- `farmers.isActive` → `true`; `sortOrder` → `0`.
- `flavor_profiles.isActive` → `true`; `sortOrder` → `0`.
- `harvest_seasons.isCurrent` → `false`; `isActive` → `true`; `sortOrder` → `0`.
- `organizations.isActive` → `true`; `sortOrder` → `0`.
- `processing_methods.fermentation` → `false`; `isActive` → `true`; `sortOrder` → `0`.
- `regions.altitudeUnit` → `MASL`; `isActive` → `true`; `sortOrder` → `0`.
- `sensory_profile_flavors.sortOrder` → `0`.
- `sensory_profiles.isActive` → `true`; `sortOrder` → `0`.
- `species.isActive` → `true`; `sortOrder` → `0`.
- `varieties.isActive` → `true`; `sortOrder` → `0`.

## Index Contract

The migration defines unique indexes for UUID/code/business identifiers and supporting FK indexes. In particular:

- `regions_countryId_idx`
- `organizations_regionId_idx`
- `farmers_regionId_idx`
- `farmers_organizationId_idx`
- `farms_farmerId_idx`
- `varieties_speciesId_idx`
- `coffee_beans_regionId_idx`
- `coffee_beans_farmerId_idx`
- `coffee_beans_farmId_idx`
- `coffee_beans_speciesId_idx`
- `coffee_beans_harvestSeasonId_idx`
- `sensory_profile_flavors_sensoryProfileId_idx`
- `sensory_profile_flavors_flavorProfileId_idx`
- `sensory_profile_flavors_sensoryProfileId_flavorProfileId_key`

The supplied `DESCRIBE` output reports `MUL` for the FK columns. In MariaDB/InnoDB, a foreign key can create/use a supporting index when an explicit index is not separately declared, so the physical `MUL` entries for `coffee_beans.varietyId`, `coffee_beans.processingMethodId`, and `coffee_beans.gradeId` are not treated as a schema mismatch by themselves.

## Prisma Mapping

Prisma uses `@@map` for the snake_case database table names and relation fields reference the database primary key `id`. The CoffeeBean model explicitly maps all seven scalar FK relationships and the optional one-to-one sensory profile relationship. This is consistent with the database contract.

## Migration Mapping

The baseline migration is `prisma/migrations/20260819152042_new_master_data/migration.sql`. It contains CREATE TABLE definitions, unique/index definitions, and the complete foreign-key section. The migration therefore represents the same application-table contract rather than introducing a second schema design.

## Inventory Conclusion

- All 15 application tables identified.
- `_prisma_migrations` identified as Prisma internal migration history.
- PK, UUID, unique, nullability, defaults, timestamps, JSON, indexes, FK columns, and relation-bearing fields reconciled.
- Prisma schema and committed migration represent the supplied database contract.
- No database redesign was introduced.
- No application-table schema change was required for Step 29.

## Runtime Gate

Before using Step 29 as a production/release gate, run the Step 29/30 SQL validation script against the actual target database and compare `information_schema` metadata with this document. This repository cannot infer live row state from Git history alone.
