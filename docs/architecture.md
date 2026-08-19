# Master Data Service Architecture

## 1. Service Boundary

`arunika-coffee-api-master-data-service` is the owner of the Master Data domain and the
`arunika_coffee_master_data` database.

The service boundary is strict:

- `arunika-coffee-api-main` is the public HTTP/API Gateway boundary.
- Master Data Service owns all master-data persistence and business rules.
- Other services must not connect to `arunika_coffee_master_data` directly.
- Inter-service access is exposed through the Master Data gRPC contract.
- The Master Data Service must not access the Users Service database directly.

```text
Client
  |
  v
Main / API Gateway
  |
  | gRPC
  v
Master Data Service
  |
  +--> Application
  |      |
  |      v
  |    Domain
  |      ^
  |      |
  +--> Infrastructure
         |
         +--> Prisma / MariaDB
```

## 2. Architecture Style

The service follows the same clean/layered dependency direction established by the Users
Service:

```text
Presentation
    |
    v
Application
    |
    v
Domain
    ^
    |
Infrastructure
```

Rules:

1. Domain contains business concepts, invariants, value objects, and repository contracts.
2. Application contains use cases/orchestration and owns transaction boundaries.
3. Presentation adapts external transport concerns, primarily gRPC, to application use cases.
4. Infrastructure implements repository contracts and owns Prisma, database, gRPC adapters,
   health, and other technical integrations.
5. Domain must not depend on NestJS, Prisma, gRPC, or database-specific types.
6. Infrastructure may depend inward on Domain/Application contracts; the reverse dependency
   is not allowed.

## 3. Domain Grouping

The database contract is the source of truth for the current Master Data domain grouping.

### Geography

Entities:

- `Country`
- `Region`

Relationships:

```text
Country 1 ---- * Region
```

`Region.countryId` is the owning foreign key. Geography is a foundational reference domain
used by organizations, farmers, and coffee beans.

### Supply Chain

Entities:

- `Organization`
- `Farmer`
- `Farm`

Relationships:

```text
Region 1 ---- * Organization
Region 1 ---- * Farmer
Organization 1 ---- * Farmer
Farmer 1 ---- * Farm
```

Farmers and organizations are associated with a region. A farmer may optionally belong to an
organization. A farm belongs to exactly one farmer.

### Coffee Taxonomy

Entities:

- `Species`
- `Variety`

Relationships:

```text
Species 1 ---- * Variety
```

`Variety.speciesId` is mandatory. Coffee Bean references both the species and, optionally,
the variety.

### Coffee Processing & Quality

Entities:

- `ProcessingMethod`
- `CoffeeGrade`
- `HarvestSeason`

These are reference/master entities consumed by `CoffeeBean`.

```text
ProcessingMethod 1 ---- * CoffeeBean
CoffeeGrade      1 ---- * CoffeeBean   (optional on CoffeeBean)
HarvestSeason    1 ---- * CoffeeBean   (optional on CoffeeBean)
```

### Sensory & Flavor

Entities:

- `FlavorProfile`
- `SensoryProfile`
- `SensoryProfileFlavor`

Relationships:

```text
CoffeeBean 1 ---- 0..1 SensoryProfile
SensoryProfile 1 ---- * SensoryProfileFlavor
FlavorProfile  1 ---- * SensoryProfileFlavor
```

`SensoryProfileFlavor` is the explicit many-to-many join entity between sensory profiles and
flavor profiles and must preserve its composite uniqueness constraint.

### Certification

Entity:

- `Certification`

Certification is currently an independent master-data reference entity. No certification
relationship is introduced because the database contract currently does not define one.

### Core Coffee Entity

`CoffeeBean` is the core entity for coffee master data.

Required references:

- `Region`
- `Species`
- `ProcessingMethod`

Optional references:

- `Farmer`
- `Farm`
- `Variety`
- `CoffeeGrade`
- `HarvestSeason`

It also has the optional one-to-one `SensoryProfile` relationship.

```text
                    +--> Farmer --------> Organization
                    |
CoffeeBean --> Region
     |              |
     +--> Farm ----> Farmer
     |
     +--> Species --> Variety
     |
     +--> ProcessingMethod
     +--> CoffeeGrade
     +--> HarvestSeason
     +--> SensoryProfile --> FlavorProfile
```

## 4. Module Boundary

The target application module grouping is domain-oriented rather than one module per
database table:

```text
src/
├── application/
│   └── <domain use cases>
├── domain/
│   ├── geography/
│   ├── supply-chain/
│   ├── coffee-taxonomy/
│   ├── coffee-processing/
│   ├── sensory/
│   ├── certification/
│   └── coffee-bean/
└── infrastructure/
    ├── database/
    ├── grpc/
    └── health/
```

The exact application/domain file layout will be introduced only when the corresponding
roadmap step requires implementation. Step 27 establishes the boundary and grouping; it does
not prematurely implement CRUD or repository code scheduled for later steps.

Current infrastructure foundation remains under:

```text
src/infrastructure/
├── database/
├── grpc/
└── health/
```

## 5. Repository Strategy

Repository interfaces are domain/application-facing contracts. Prisma implementations stay
inside Infrastructure.

```text
Domain
  |
  +--> CountryRepository
  +--> RegionRepository
  +--> OrganizationRepository
  +--> FarmerRepository
  +--> FarmRepository
  +--> SpeciesRepository
  +--> VarietyRepository
  +--> ProcessingMethodRepository
  +--> CoffeeGradeRepository
  +--> HarvestSeasonRepository
  +--> FlavorProfileRepository
  +--> SensoryProfileRepository
  +--> SensoryProfileFlavorRepository
  +--> CertificationRepository
  +--> CoffeeBeanRepository

Infrastructure
  |
  +--> Prisma implementations
  +--> Prisma transaction handling
  +--> Generated Prisma Client
```

Repository rules:

1. Do not expose Prisma models through domain contracts.
2. Do not place Prisma queries in controllers or application use cases.
3. Do not create a generic repository abstraction merely to reduce file count.
4. Use focused repository contracts aligned with domain responsibilities.
5. Cross-entity writes that must be atomic use an explicit application transaction boundary.
6. Foreign-key and relationship integrity remains enforced by the database and is also
   validated at the application/domain boundary where business semantics require it.
7. Database mapping belongs in Infrastructure; domain entities remain persistence-agnostic.
8. Repository implementations own Prisma-specific query shape, relation loading, and mapping.

## 6. Database Ownership and Contract

`arunika_coffee_master_data` is the database contract for this service.

Current tables:

```text
countries
regions
organizations
farmers
farms
species
varieties
processing_methods
coffee_grades
harvest_seasons
flavor_profiles
sensory_profiles
sensory_profile_flavors
certifications
coffee_beans
```

The implementation must preserve existing primary keys, unique keys, foreign keys,
nullability, defaults, `isActive`, `sortOrder`, and timestamps.

No new table, field, relationship, or business rule is introduced by Step 27.

## 7. Transport Boundary

The Master Data Service exposes its internal API through gRPC.

Transport responsibilities are limited to:

- protobuf request/response adaptation;
- input boundary validation;
- mapping application/domain errors to transport errors;
- returning transport-safe DTOs/messages.

Controllers must not contain Prisma queries or domain business rules.

The public HTTP API remains owned by `arunika-coffee-api-main`.

## 8. Scope Guardrails

Step 27 establishes architecture only.

The following remain deferred to their roadmap steps:

- database foundation validation;
- domain entity/value-object implementation;
- repository implementation;
- CRUD;
- filtering/searching/pagination;
- validation rules beyond architectural boundaries;
- finalized Master Data protobuf CRUD contract;
- real gRPC-to-database integration;
- observability/security hardening;
- Docker and production hardening.

Future steps must follow this architecture rather than introduce competing patterns.
