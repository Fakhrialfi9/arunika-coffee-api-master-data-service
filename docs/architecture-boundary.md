# Step 01 Architecture Boundary

## Repository strategy

Arunika Coffee uses separate repositories:

- `arunika-coffee-api-main` — future API Gateway / public HTTP boundary
- `arunika-coffee-api-master-data-service` — Master Data Service boundary

These repositories are not a monorepo and do not share an npm workspace.

## Master Data Service boundary

The Master Data Service will eventually own the Master Data domain and the `arunika_coffee_master_data` database. Other services must not access that database directly.

Step 01 only establishes the application foundation. No database connection, ORM, repository, domain implementation, CRUD, authentication, authorization, Gateway, or gRPC server is implemented.

## Future gRPC boundary

The future proto layout is:

```text
proto/
└── master-data/
    └── master-data.proto
```

The CRUD contract is intentionally deferred to Step 12. No `.proto` contract is created during Step 01.

## Future clean architecture

The intended dependency direction is:

```text
Presentation → Application → Domain ← Infrastructure
```

Only the foundation required to support this direction is established now. Empty future domain folders are intentionally avoided.
