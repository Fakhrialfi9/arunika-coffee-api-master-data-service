# Organization Master Data

## Scope

Step 30 establishes the Organization master-data contract and domain boundary for `organizations`, including its mandatory relationship to `regions` and database-backed integrity constraints.

CRUD, repository orchestration, filtering, pagination, and gRPC transport remain deferred to their later roadmap steps.

## Relationship

```text
Region 1 ---- * Organization
```

- `regions` is the geographic parent entity.
- `organizations` is the organization master entity.
- `organizations.regionId` is mandatory and is the owning foreign key.
- A region may have zero or many organizations.
- Every organization belongs to exactly one region.
- The database foreign key is the final integrity boundary for the relationship.

## Organization Contract

The existing database contract remains unchanged. Organization fields are:

- `id` — primary key.
- `uuid` — unique external identity.
- `code` — unique master-data code.
- `name` — required organization name.
- `type` — required organization classification.
- `regionId` — required parent-region foreign key.
- `contactName`, `phone`, `email` — optional contact information.
- `establishedYear` / `memberCount` — optional organization profile values.
- `description` — optional organization description.
- `isActive` / `sortOrder` — master-data lifecycle and ordering fields.
- `createdAt` / `updatedAt` — timestamps.

No new database field is introduced by Step 30.

## Domain Invariants

The Organization domain entity follows the existing Users Service domain pattern while remaining scoped to the current step:

1. `uuid` must be a valid UUID.
2. `code`, `name`, `type`, and `regionId` are required and must contain 1–191 characters.
3. Optional string fields must not exceed the database contract length of 191 characters.
4. `isActive` defaults to `true` and `sortOrder` defaults to `0`.
5. `createdAt` and `updatedAt` must be valid dates.
6. The domain does not infer organization types, geographic rules, member-count rules, or other business rules that are not part of the database contract.

## Integrity Expectations

The Step 30 quality gate verifies:

- the `organizations` table exists;
- `organizations.regionId` is non-null;
- `organizations.regionId` references `regions.id`;
- a region can own multiple organizations;
- Prisma can load both organization → region and region → organizations relationships;
- organization `code` uniqueness is enforced by the database;
- invalid parent-region references are rejected by the database;
- the Organization domain entity validates the contract without changing the database design.
