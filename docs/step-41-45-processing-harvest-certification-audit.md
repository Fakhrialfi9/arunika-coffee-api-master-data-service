# Steps 41-45 — Processing, Harvest Season, and Certification Audit

## Scope

This document records the contract audit and implementation for PHASE 2 Steps 41-45. The `arunika_coffee_master_data` database remains the source of truth. No migration or schema design change is introduced by this batch.

## Step 41 — Processing & Quality Relationship

`coffee_beans.processingMethodId` is required and references `processing_methods.id` with `ON DELETE RESTRICT` / `ON UPDATE CASCADE`. `coffee_beans.gradeId` is nullable and references `coffee_grades.id` with `ON DELETE SET NULL` / `ON UPDATE CASCADE`. Both columns are indexed by the database contract.

The Prisma mappings are one-to-many from `ProcessingMethod` and `CoffeeGrade` to `CoffeeBean`, with the owning FK fields defined on `CoffeeBean`. No composite relationship or additional FK is introduced.

The database FK guarantees referential integrity, but it does not encode `isActive` semantics. An inactive processing method or grade may remain referenced because active state is lifecycle metadata, not part of the FK contract. Consumers must therefore distinguish `exists` from `active`; this batch does not silently reinterpret an existing FK as an active-only FK.

The read-only SQL audit in `scripts/validate-step-41-45.sql` checks FK metadata, nullability, orphan references, and inactive references.

## Step 42 — Harvest Season Master

The Prisma `HarvestSeason` model matches the database contract: required `name` and `year`; optional `label`, `seasonType`, `startMonth`, `endMonth`, and `description`; required `isCurrent`, `isActive`, and `sortOrder` with database-aligned defaults; unique `uuid`; indexed `year`; and managed timestamps.

`coffee_beans.harvestSeasonId` remains nullable and references `harvest_seasons.id` with `ON DELETE SET NULL` / `ON UPDATE CASCADE`.

No new uniqueness constraint is added for `isCurrent` because the database contract does not contain one.

## Step 43 — Harvest Season Integrity

The domain invariant is now explicit:

- `year` must be an integer from 1 through 9999.
- `startMonth` and `endMonth`, when supplied, must each be 1 through 12.
- A period is represented as either both months or neither month. Partial periods are rejected by the domain entity while the database remains nullable.
- When both months are present, `startMonth <= endMonth`.
- `isCurrent=true` requires `isActive=true`.
- At most one harvest season may be current at the persistence boundary.

Because the database contract has no native singleton constraint for `isCurrent`, the singleton and active-current invariants are enforced in the `PrismaHarvestSeasonRepository` transaction path rather than by adding a migration. The repository rejects a second current season and rejects attempts to make a current season inactive. This keeps the database contract intact.

The SQL audit also checks existing rows for invalid year/month data, partial periods, reversed periods, duplicate current rows, inactive current rows, and orphan `coffee_beans.harvestSeasonId` references.

## Step 44 — Certification Master

`certifications` is a standalone master entity. The Prisma model matches the database contract including unique `uuid`, unique `code`, required `name`, optional descriptive/authority/scope fields, `requiresExpiration` defaulting to false, `isActive` defaulting to true, `sortOrder` defaulting to zero, and timestamps.

`requiresExpiration` is metadata only. There is deliberately no expiration-date field because the database contract does not provide one. No owner or assignment relationship is inferred from this flag.

## Step 45 — Certification Relationship Audit

The migration contains no FK from `certifications` and no FK from another table to `certifications`. The Prisma `Certifications` model contains no relation fields. The database contract also contains no `certificationId` column or certification join table.

Therefore, Certification is explicitly **standalone Master Data** in the current database boundary. There is no direct ownership/assignment relationship to `CoffeeBean`, `Farmer`, `Farm`, `Organization`, `Region`, or `Country`.

Business concepts such as “a farmer has a certification” or “an organization issues a certification” are future domain concepts only until a database relationship is introduced through an approved contract change.

## Database Contract Impact

No table, field, FK, index, unique constraint, nullability, default, JSON field, or migration is changed. The only implementation changes are domain validation and persistence-layer enforcement of invariants that are not native database constraints.

## Validation

Use `scripts/validate-step-41-45.sql` against `arunika_coffee_master_data` for read-only database verification. It intentionally reports data-level results instead of assuming the database is empty or valid.
