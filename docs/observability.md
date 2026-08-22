# Observability

## Logging

Logs are structured JSON events. Request logs contain only service/RPC/request metadata and duration. Sensitive request payloads, database URLs, passwords, credentials, and arbitrary exception messages are not logged by the gRPC observability layer.

## Correlation

The gRPC boundary accepts `x-request-id`. Valid IDs are reused; invalid/missing IDs receive a generated UUID. The ID is attached to error metadata so consumers can correlate failures with service logs.

## Metrics

The gRPC interceptor records request count and request duration through the OpenTelemetry Metrics API. The application does not expose a database-backed metrics endpoint or add a third-party telemetry stack.

## Tracing

The service initializes OpenTelemetry Node SDK auto-instrumentation as part of the application lifecycle when tracing or metrics are enabled. Shutdown closes the SDK before process termination. Export configuration remains deployment-controlled through standard OpenTelemetry environment configuration.

## Database observability

Database health is observed through a bounded `SELECT 1` readiness check. Health failures are converted to `NOT_SERVING`; database exceptions are not returned to consumers.
