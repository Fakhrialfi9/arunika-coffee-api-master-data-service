# Step 36 — Coffee Taxonomy: Species

## Status

**PASS against the committed schema and existing domain/entity tests.**

## Database Contract

`species` contains:

- `id` — primary key, internal persistence identity.
- `uuid` — unique external identity.
- `code` — required and globally unique.
- `name` — required.
- `commonName` — optional.
- `scientificName` — optional.
- `originRegion` — optional string metadata, not a FK to `regions`.
- `description` — optional.
- `isActive` — required, default `true`.
- `sortOrder` — required, default `0`.
- `createdAt` — required, default current timestamp.
- `updatedAt` — required, database-managed update timestamp.

The Prisma model matches the contract and exposes `varieties` and `coffeeBeans` as inverse relations without introducing additional database columns or constraints.

## Domain Validation

The existing `Species` entity follows the Users Service domain pattern:

- UUID generation/reconstitution;
- required-string validation;
- nullable optional fields;
- `isActive` defaulting to `true`;
- `sortOrder` defaulting to `0`;
- timestamp validation;
- immutable entity state for this master-data foundation step.

The existing unit tests cover UUID generation, defaults, optional fields, reconstitution, invalid required values, and the 191-character database limit.

## Uniqueness

`uuid` and `code` are database-enforced unique keys. Domain construction does not attempt to duplicate database uniqueness enforcement because uniqueness requires persistence context. Duplicate-code rejection therefore remains a repository/database concern.

## Lifecycle

`isActive` is a lifecycle flag, not a delete marker. The contract does not define a cascade rule that disables varieties or coffee beans when a species becomes inactive. No such rule is invented here.

## Taxonomy Role

Species is the mandatory taxonomy parent for Variety. `varieties.speciesId` is NOT NULL and has a RESTRICT FK to `species.id`. CoffeeBean also has a mandatory `speciesId` FK.

This makes Species ready to act as the parent taxonomy entity without changing the database design.
