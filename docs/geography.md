# Geography Master Data

## Scope

Step 29 establishes the Geography master-data contract for `countries` and `regions` without introducing CRUD, repository, domain, or gRPC implementations scheduled for later roadmap steps.

## Hierarchy

```text
Country 1 ---- * Region
```

- `countries` is the parent master entity.
- `regions` is the child master entity.
- `regions.countryId` is mandatory and is the owning foreign key.
- A country may have zero or many regions.
- Every region belongs to exactly one country.
- The database foreign key is the final integrity boundary for the relationship.

## Country Contract

The existing database contract remains unchanged. Geography-specific identity fields are:

- `id` — primary key.
- `uuid` — unique external identity.
- `code` — unique master-data code.
- `name` — required country name.
- `iso2` — unique ISO 3166-1 alpha-2 code.
- `iso3` — unique ISO 3166-1 alpha-3 code.
- `isCoffeeOrigin` — explicit coffee-origin classification.
- `isActive` / `sortOrder` — master-data lifecycle and ordering fields.
- `createdAt` / `updatedAt` — timestamps.

No new country field is introduced by Step 29.

## Region Contract

The existing database contract remains unchanged. Geography-specific fields are:

- `id` — primary key.
- `uuid` — unique external identity.
- `countryId` — required parent-country foreign key.
- `code` — unique master-data code.
- `name` — required region name.
- `type` and administrative fields (`province`, `district`, `city`, `village`) — optional location classification.
- `latitude` / `longitude` — optional coordinates.
- `altitudeMin` / `altitudeMax` / `altitudeUnit` — optional terroir elevation data.
- `climate` / `soilType` — optional terroir metadata.
- `isActive` / `sortOrder` — master-data lifecycle and ordering fields.
- `createdAt` / `updatedAt` — timestamps.

No new region field is introduced by Step 29.

## Origin Semantics

`Country.isCoffeeOrigin` is the explicit origin classification in the current database contract.

Rules for this step:

1. `isCoffeeOrigin = true` means the country is classified as a coffee-origin country by master data.
2. `isCoffeeOrigin = false` is the default and means no coffee-origin classification is asserted.
3. A region does not have a separate `isCoffeeOrigin` field; origin classification therefore remains a country-level semantic.
4. `Region.countryId` establishes geographic membership only. A region row must not implicitly change the country's origin classification.
5. No additional origin table, field, relationship, or inferred business rule is introduced.

## Integrity Expectations

The Step 29 quality gate verifies:

- the required geography tables exist;
- `regions.countryId` is non-null;
- `regions.countryId` references `countries.id`;
- a country can own multiple regions;
- Prisma can load the country → regions relationship;
- invalid parent-country references are rejected by the database;
- the coffee-origin flag remains an explicit country-level attribute.

CRUD, repository abstractions, domain entities/value objects, filtering, validation orchestration, and gRPC transport remain deferred to their roadmap steps.
