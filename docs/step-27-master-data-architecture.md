# Step 27 — Master Data Architecture

## Status

**PASS**

## Scope

Step 27 defines and documents the architecture for `arunika-coffee-api-master-data-service`:

- service/database boundary;
- domain grouping;
- module boundaries;
- clean dependency direction;
- repository strategy;
- gRPC transport boundary;
- database ownership and contract guardrails.

## Architecture Decision

Master Data Service owns the `arunika_coffee_master_data` database and the complete
Master Data domain. Other services, including Main/API Gateway, must access Master Data
through the service contract rather than directly accessing its database.

The architecture follows the Users Service reference pattern:

```text
Presentation → Application → Domain ← Infrastructure
```

Infrastructure implements domain-facing contracts and contains Prisma/database concerns.

## Domain Groups

| Domain | Entities |
| --- | --- |
| Geography | Country, Region |
| Supply Chain | Organization, Farmer, Farm |
| Coffee Taxonomy | Species, Variety |
| Coffee Processing & Quality | ProcessingMethod, CoffeeGrade, HarvestSeason |
| Sensory & Flavor | FlavorProfile, SensoryProfile, SensoryProfileFlavor |
| Certification | Certification |
| Core Coffee | CoffeeBean |

`CoffeeBean` is the core coffee entity and references the required and optional master
data entities defined by the database contract.

## Repository Strategy

Repository contracts belong to the domain/application boundary and Prisma implementations
belong to Infrastructure. Prisma types must not leak into domain contracts.

Repository implementations are focused by domain responsibility rather than introducing a
generic repository abstraction.

Transactions are owned by the application/use-case boundary when an operation spans multiple
repositories and must be atomic.

## Scope Guardrail

Step 27 does not introduce CRUD, new database structures, finalized CRUD protobuf messages,
or future domain behavior. Those concerns remain assigned to their roadmap steps.

See `docs/architecture.md` for the complete architecture contract.
