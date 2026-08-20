# Master Data Architecture

## Boundary

`master-data-service` owns the `arunika_coffee_master_data` database and is the only service allowed to access it directly.

External consumers use the service contract (gRPC). They must not connect to the Master Data MySQL database directly.

## Domain grouping

- Geography: `countries`, `regions`
- Supply Chain: `organizations`, `farmers`, `farms`
- Coffee Taxonomy: `species`, `varieties`
- Coffee Quality: `coffee_beans`, `processing_methods`, `coffee_grades`, `harvest_seasons`
- Sensory & Flavor: `sensory_profiles`, `sensory_profile_flavors`, `flavor_profiles`
- Certification: `certifications`

## Dependency direction

```text
Presentation (gRPC)
        |
        v
Application / Use Cases
        |
        v
Domain / Repository Contracts
        |
        v
Infrastructure / Prisma / MySQL
```

Presentation and application code must not construct Prisma clients or access `DATABASE_URL` directly. Database concerns remain in infrastructure/repository implementations.

## Database ownership

The Prisma schema and the deployed MySQL schema are treated as the database contract. Code must adapt to that contract rather than introducing relationships merely to simplify application code.

## Relationship boundaries

The core graph is:

```text
Country -> Region
Region -> Organization -> Farmer -> Farm
Region -> Farmer
Species -> Variety -> CoffeeBean
Region/Farmer/Farm/Species/Variety -> CoffeeBean
ProcessingMethod -> CoffeeBean
CoffeeGrade -> CoffeeBean
HarvestSeason -> CoffeeBean
CoffeeBean -> SensoryProfile -> FlavorProfile
```

`certifications` is intentionally standalone at database FK level. No certification foreign key is invented until an explicit domain/database contract requires one.

## Repository strategy

Repository contracts belong to the domain/application boundary. Prisma, SQL, adapters, connection handling, and persistence mapping belong to infrastructure. Controllers/gRPC handlers orchestrate transport concerns only.
