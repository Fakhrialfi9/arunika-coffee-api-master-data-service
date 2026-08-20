# Step 35 — Farmer–Farm Supply Chain Graph

## Status

**PASS against the committed database contract; live-row validation remains a runtime gate.**

## Contract Graph

```text
Country
└── Region
    ├── Organization
    └── Farmer
        └── Farm
```

The committed migration defines the graph through four FK edges:

| Edge | Child FK | Parent | Nullable | ON DELETE |
|---|---|---|---|---|
| Country → Region | `regions.countryId` | `countries.id` | No | RESTRICT |
| Region → Organization | `organizations.regionId` | `regions.id` | No | RESTRICT |
| Region → Farmer | `farmers.regionId` | `regions.id` | No | RESTRICT |
| Farmer → Farm | `farms.farmerId` | `farmers.id` | No | RESTRICT |

`farmers.organizationId` is an additional optional edge from Farmer → Organization. It uses `SET NULL` and does not replace the mandatory Farmer → Region relationship.

## Semantics

- A Region belongs to exactly one Country.
- An Organization belongs to exactly one Region.
- A Farmer belongs to exactly one Region.
- A Farmer may optionally belong to one Organization.
- A Farm belongs to exactly one Farmer.
- Farm region is derived through its Farmer because `farms` has no `regionId` column.
- No Organization ↔ Farmer composite FK or Farm ↔ Region FK is inferred because neither exists in the database contract.

## Integrity

The database-native FKs prevent missing parent references. The runtime audit additionally checks:

- orphan Country → Region references;
- orphan Region → Organization references;
- orphan Region → Farmer references;
- orphan Farmer → Organization references when nullable FK is populated;
- orphan Farmer → Farm references;
- optional Organization/Farmer regional consistency (`farmers.regionId = organizations.regionId`) as a business-graph audit.

The regional consistency check is an application/business invariant, not a new database constraint. It must not be converted into a composite FK without an explicit database-contract change.

## Lifecycle

`isActive` and `sortOrder` remain independent master-data attributes. The database contract does not require active parents for active children, so Step 35 does not invent such a lifecycle rule.

## Implementation Boundary

Existing Farmer and Farm domain entities already model the mandatory IDs and defaults from the database contract. No new database field, FK, nullable change, default, or repository layer was introduced for Step 35.

Repository orchestration remains outside this step's implementation scope. The read-only runtime SQL audit is the validation boundary until the later application/repository flows consume these relationships.
