# Step 37 — Coffee Taxonomy: Variety

## Status

**PASS against the committed schema and existing domain/entity tests.**

## Database Contract

`varieties` contains:

- `id` — primary key, internal persistence identity.
- `uuid` — unique external identity.
- `speciesId` — required FK to `species.id`.
- `code` — required and globally unique.
- `name` — required.
- `geneticBackground` — optional.
- `originCountry` — optional string metadata, not a FK to `countries`.
- `plantCharacteristics` — optional JSON.
- `flavorCharacteristics` — optional JSON.
- `description` — optional.
- `isActive` — required, default `true`.
- `sortOrder` — required, default `0`.
- `createdAt` — required, default current timestamp.
- `updatedAt` — required, database-managed update timestamp.

## Species → Variety

The Prisma relation is:

```text
Species 1 ─── N Variety
```

`Variety.speciesId` is required and references `Species.id`. The migration enforces `ON DELETE RESTRICT`, so a species cannot be removed while varieties reference it.

No alternate parent relationship is inferred.

## JSON Mapping

`plantCharacteristics` and `flavorCharacteristics` remain JSON because the database contract defines them as JSON columns. The domain entity preserves them as opaque values and does not convert them into relational fields.

The existing entity tests verify that supplied JSON values are preserved and that omitted values remain `null`.

## Uniqueness and Lifecycle

`uuid` and `code` are database-enforced unique keys. Duplicate-code enforcement remains a persistence concern rather than an in-memory domain check.

`isActive` defaults to `true` and `sortOrder` defaults to `0`. No automatic propagation of active state from Species to Variety is introduced because that behavior is not part of the database contract.

## Integrity Boundary

A Variety cannot be persisted without a Species parent because `speciesId` is NOT NULL and the database FK is mandatory. Existing domain validation also rejects an empty `speciesId`.

The later CoffeeBean application flow must use the same Species parent when a Variety is selected; the Step 38 audit explicitly validates this cross-entity invariant.
