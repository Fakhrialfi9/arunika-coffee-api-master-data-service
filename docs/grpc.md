# gRPC

## Contract

The Master Data Service uses protobuf package `arunika.coffee.master_data.v1` and listens on the configured `GRPC_MASTER_HOST:GRPC_MASTER_PORT` (default `50053`).

`proto/master-data/v1/master-data.proto` is the canonical transport contract owned by this service. Consumers must copy/sync the versioned contract rather than access the Master Data database.

The server also registers the standard gRPC health-check protocol from `grpc-health-check`.

## Health semantics

- `liveness`: process/server health; it does not depend on MySQL.
- `readiness`: MySQL dependency health.
- `arunika.coffee.master_data.v1.MasterDataService`: follows readiness state.
- empty health service name: follows readiness state.

## Metadata

Consumers may send `x-request-id` metadata. If it is missing or invalid, the service generates a request ID. The ID is used for structured error/request logging and is returned in gRPC error metadata.

Do not send credentials, database URLs, passwords, or bearer tokens as request metadata intended for logging.

## Errors

Application validation errors map to `INVALID_ARGUMENT` and not-found errors map to `NOT_FOUND`. Unique conflicts map to `ALREADY_EXISTS`; invalid foreign-key/business relationships map to `FAILED_PRECONDITION`; persistence/unexpected failures map to `INTERNAL`.

Internal Prisma/database details are never returned as consumer-facing error messages.

## Compatibility boundary

The Main/API Gateway must consume this service exclusively through gRPC. It must not connect directly to `arunika_coffee_master_data`.

The current repository contains a minimal health-only Master Data protobuf/RPC surface. Full CRUD and relationship RPCs required by the earlier Step 71–75 contract are not present in the current `master-data.proto`; this is a known compatibility blocker for Step 89 and must be resolved before claiming consumer readiness.
