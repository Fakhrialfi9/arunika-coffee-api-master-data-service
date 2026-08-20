# Step 30 — Referential Integrity

## Status

**PASS against the committed database contract and Prisma migration; live-row validation remains a runtime gate.**

## Complete FK Inventory

The baseline migration defines 17 foreign keys:

| # | Child | FK | Parent | Cardinality | Nullable | ON DELETE | ON UPDATE |
|---:|---|---|---|---|---|---|---|
| 1 | `regions` | `countryId` | `countries.id` | Country 1 → Region N | No | RESTRICT | CASCADE |
| 2 | `organizations` | `regionId` | `regions.id` | Region 1 → Organization N | No | RESTRICT | CASCADE |
| 3 | `farmers` | `regionId` | `regions.id` | Region 1 → Farmer N | No | RESTRICT | CASCADE |
| 4 | `farmers` | `organizationId` | `organizations.id` | Organization 1 → Farmer 0..N | Yes | SET NULL | CASCADE |
| 5 | `farms` | `farmerId` | `farmers.id` | Farmer 1 → Farm N | No | RESTRICT | CASCADE |
| 6 | `coffee_beans` | `regionId` | `regions.id` | Region 1 → CoffeeBean N | No | RESTRICT | CASCADE |
| 7 | `coffee_beans` | `farmerId` | `farmers.id` | Farmer 1 → CoffeeBean 0..N | Yes | SET NULL | CASCADE |
| 8 | `coffee_beans` | `farmId` | `farms.id` | Farm 1 → CoffeeBean 0..N | Yes | SET NULL | CASCADE |
| 9 | `coffee_beans` | `speciesId` | `species.id` | Species 1 → CoffeeBean N | No | RESTRICT | CASCADE |
| 10 | `coffee_beans` | `varietyId` | `varieties.id` | Variety 1 → CoffeeBean 0..N | Yes | SET NULL | CASCADE |
| 11 | `coffee_beans` | `processingMethodId` | `processing_methods.id` | ProcessingMethod 1 → CoffeeBean N | No | RESTRICT | CASCADE |
| 12 | `coffee_beans` | `gradeId` | `coffee_grades.id` | CoffeeGrade 1 → CoffeeBean 0..N | Yes | SET NULL | CASCADE |
| 13 | `coffee_beans` | `harvestSeasonId` | `harvest_seasons.id` | HarvestSeason 1 → CoffeeBean 0..N | Yes | SET NULL | CASCADE |
| 14 | `varieties` | `speciesId` | `species.id` | Species 1 → Variety N | No | RESTRICT | CASCADE |
| 15 | `sensory_profiles` | `coffeeBeanId` | `coffee_beans.id` | CoffeeBean 1 → SensoryProfile 0..1 | No + UNIQUE | RESTRICT | CASCADE |
| 16 | `sensory_profile_flavors` | `sensoryProfileId` | `sensory_profiles.id` | SensoryProfile 1 → join rows N | No | CASCADE | CASCADE |
| 17 | `sensory_profile_flavors` | `flavorProfileId` | `flavor_profiles.id` | FlavorProfile 1 → join rows N | No | RESTRICT | CASCADE |

The migration's FK section explicitly contains these 17 constraints. Prisma relation definitions use the same child fields and reference the parent `id` primary keys.

## Relationship Semantics

### Geography

`Country → Region` is mandatory on the child because `regions.countryId` is NOT NULL and uses `ON DELETE RESTRICT`.

### Supply Chain

`Region → Organization` and `Region → Farmer` are mandatory. `Farmer → Organization` is optional and uses `SET NULL` because `farmers.organizationId` is nullable.

`Farmer → Farm` is mandatory. A farm cannot exist without a farmer under the database contract.

### Coffee Bean

`CoffeeBean` is the central entity. Its mandatory references are region, species, and processing method. Farmer, farm, variety, grade, and harvest season are nullable and therefore optional at the database level. Their delete behavior is `SET NULL`, preserving the coffee bean row while removing the optional association.

### Taxonomy

`Species → Variety` is mandatory. `CoffeeBean → Species` is mandatory, while `CoffeeBean → Variety` is optional.

### Sensory / Flavor

`CoffeeBean → SensoryProfile` is one-to-zero-or-one from the parent perspective because `sensory_profiles.coffeeBeanId` is UNIQUE. The child FK itself is required.

`SensoryProfile → SensoryProfileFlavor` and `FlavorProfile → SensoryProfileFlavor` form the normalized join relationship. The pair `(sensoryProfileId, flavorProfileId)` is UNIQUE, preventing duplicate links.

## Orphan / Invalid FK Checks

The repository now contains `scripts/validate-step-29-30.sql`, a read-only SQL audit that checks every FK relationship for orphan rows, validates the one-to-one sensory profile constraint, validates the unique sensory/flavor pair, and reports the actual `information_schema` FK rules.

Because foreign keys are enforced by the database, an invalid non-null FK cannot normally be persisted while the constraints are present. The orphan queries are retained as an explicit audit of existing data and as protection against a database that differs from the committed contract.

## Prisma Consistency

The Prisma schema declares relation fields corresponding to the database FKs. The CoffeeBean model maps all seven CoffeeBean FK columns; the other models declare the inverse relation fields. Nullable Prisma relation fields match nullable database FK columns. No database-required relation was made optional in Prisma and no database-optional relation was made required solely for application convenience.

## No Missing / Extra Relationship

The complete committed migration FK set is the contract. No additional relationship is inferred from business semantics alone. In particular, the `species.originRegion` and `varieties.originCountry` string fields are not foreign keys and must not be treated as geographic relations.

## Runtime Gate

The following must be run against the actual `arunika_coffee_master_data` instance before the final runtime acceptance decision:

```bash
mysql --host="$DATABASE_HOST" \
      --port="$DATABASE_PORT" \
      --user="$DATABASE_USER" \
      --password="$DATABASE_PASSWORD" \
      "$DATABASE_NAME" < scripts/validate-step-29-30.sql
```

Expected runtime result:

- actual FK count = `17`;
- all orphan counts = `0`;
- duplicate `sensory_profiles.coffeeBeanId` count = `0`;
- duplicate sensory/flavor pair count = `0`;
- FK rules match the table above.

No database mutation is performed by this validation.
