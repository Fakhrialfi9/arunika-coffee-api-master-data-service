# Farmer & Farm Master Data

## Scope

Step 31 establishes the Farmer and Farm master-data contract for `farmers` and `farms`, including geographic ownership, organization membership, and farm ownership relationships.

CRUD, repository orchestration, filtering, pagination, and gRPC transport remain deferred to their later roadmap steps.

## Relationship

```text
Region 1 ---- * Farmer
Organization 1 ---- * Farmer
Farmer 1 ---- * Farm
```

- `regions` is the geographic parent of a farmer.
- `organizations` is an optional organizational parent of a farmer.
- `farmers.regionId` is mandatory.
- `farmers.organizationId` is optional.
- `farms.farmerId` is mandatory.
- A farmer may own zero or many farms.
- Every farm belongs to exactly one farmer.
- Database foreign keys are the final integrity boundary for all relationships.

## Farmer Contract

The existing database contract remains unchanged. Farmer fields are:

- `id` — primary key.
- `uuid` — unique external identity.
- `code` — unique master-data code.
- `name` / `type` — required farmer identity and classification.
- `regionId` — required region foreign key.
- `organizationId` — optional organization foreign key.
- `contactName`, `phone`, `email` — optional contact information.
- `farmingSinceYear`, `description`, `story` — optional farming profile values.
- `isActive` / `sortOrder` — master-data lifecycle and ordering fields.
- `createdAt` / `updatedAt` — timestamps.

## Farm Contract

The existing database contract remains unchanged. Farm fields are:

- `id` — primary key.
- `uuid` — unique external identity.
- `name` — required farm name.
- `farmerId` — required farmer foreign key.
- `area` / `areaUnit` — optional farm area information; `areaUnit` defaults to `hectare`.
- `establishedYear` — optional establishment year.
- `altitudeMin` / `altitudeMax` / `altitudeUnit` — optional elevation information; `altitudeUnit` defaults to `MASL`.
- `latitude` / `longitude` — optional geographic coordinates.
- `soilType`, `climate`, `farmingPractice`, `description` — optional farm profile values.
- `isActive` / `sortOrder` — master-data lifecycle and ordering fields.
- `createdAt` / `updatedAt` — timestamps.

No new database field is introduced by Step 31.

## Domain Invariants

The Farmer and Farm domain entities follow the existing Users Service domain pattern while remaining scoped to the current step:

1. `uuid` must be a valid UUID.
2. Farmer `code`, `name`, `type`, and `regionId` are required and must contain 1–191 characters.
3. Farm `name` and `farmerId` are required and must contain 1–191 characters.
4. Optional string fields must not exceed the database contract length of 191 characters.
5. Farmer `organizationId` remains nullable because the database contract makes the relationship optional.
6. Farm `areaUnit` defaults to `hectare` and `altitudeUnit` defaults to `MASL`, matching the database contract.
7. `isActive` defaults to `true` and `sortOrder` defaults to `0`.
8. `createdAt` and `updatedAt` must be valid dates.
9. The domain does not infer farmer types, organization eligibility, geographic rules, coordinate ranges, or other business rules that are not part of the database contract.

## Integrity Expectations

The Step 31 quality gate verifies:

- the `farmers` and `farms` tables exist;
- `farmers.regionId` is non-null and references `regions.id`;
- `farmers.organizationId` is nullable and references `organizations.id`;
- `farms.farmerId` is non-null and references `farmers.id`;
- Prisma can load farmer → region, farmer → organization, farmer → farms, and farm → farmer relationships;
- farmer `code` uniqueness is enforced by the database;
- invalid region, organization, and farmer references are rejected by the database;
- the Farmer and Farm domain entities validate the database contract without changing the database design.
