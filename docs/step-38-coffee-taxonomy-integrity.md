# Step 38 — Coffee Taxonomy Integrity

## Status

**PASS against the committed database contract; live-row mismatch validation remains a runtime gate.**

## Dependency Graph

```text
Species
└── Variety
    └── CoffeeBean (optional Variety)
```

The database contract requires:

- `varieties.speciesId` → `species.id` and NOT NULL;
- `coffee_beans.speciesId` → `species.id` and NOT NULL;
- `coffee_beans.varietyId` → `varieties.id` and nullable.

The FK delete rules are RESTRICT for Variety → Species and CoffeeBean → Species, and SET NULL for CoffeeBean → Variety.

## Required Invariant

The database can guarantee that every populated `coffee_beans.varietyId` references an existing Variety, but it cannot natively guarantee that the selected Variety belongs to the same Species stored in `coffee_beans.speciesId`.

Therefore the following application/domain invariant is required:

```text
coffeeBean.varietyId IS NOT NULL
    => variety.speciesId === coffeeBean.speciesId
```

A mismatch is invalid even though both individual FKs may be valid.

No composite FK is added because it is not present in the database contract.

## Orphan Checks

The runtime audit checks:

- orphan `varieties.speciesId` references;
- orphan mandatory `coffee_beans.speciesId` references;
- orphan nullable `coffee_beans.varietyId` references;
- Species/Variety mismatch rows where both `speciesId` and `varietyId` are populated;
- taxonomy references from active CoffeeBeans as well as the full table, so inactive historical master data is not silently skipped.

## Active / Inactive Semantics

`isActive` is independently stored on Species, Variety, and CoffeeBean. The database contract does not define an automatic cascade or a rule requiring an active parent for an active child. Therefore this step does not invent one.

Deactivation may affect application selection/query behavior later, but it must not mutate FK relationships or change nullable semantics.

## Implementation Boundary

The existing Species and Variety entities already validate their contract fields and required `speciesId`. Existing Prisma relations map the FK graph exactly.

The cross-row mismatch is a persistence/application invariant and is validated by the read-only SQL audit. Enforcement during CoffeeBean create/update belongs in the later application/repository flow that owns CoffeeBean persistence; Step 38 deliberately does not modify that repository layer.

## No Schema Change

No table, column, FK, unique constraint, JSON field, default, or nullability rule is changed by Step 38.
