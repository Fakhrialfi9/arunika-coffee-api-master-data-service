# Configuration

Configuration is loaded through NestJS `ConfigModule` and validated before the application starts.

Required groups:

- application: `NODE_ENV`, `APP_NAME`, `APP_HOST`, `APP_PORT`
- database: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_URL`
- gRPC: `GRPC_MASTER_HOST`, `GRPC_MASTER_PORT`, `MASTER_GRPC_TIMEOUT_MS`
- security: `SECURITY_*`
- logging: `LOG_ENABLED`, `LOG_LEVEL`
- OpenTelemetry: `OTEL_SERVICE_NAME`, `OTEL_TRACING_ENABLED`, `OTEL_TRACES_SAMPLER_ARG`, `OTEL_METRICS_ENABLED`, `OTEL_METRIC_EXPORT_INTERVAL`

Numeric ports/timeouts and message limits are range-checked. `DATABASE_URL` must be a valid MySQL URL and its database name must match `DATABASE_NAME`. Trace sampler argument must be between 0 and 1.

Production additionally rejects localhost database endpoints, root/weak database credentials, local CORS origins, localhost gRPC binding, and debug/verbose log levels.

Secrets belong in the deployment secret manager/environment, never in source control or Docker layers.
