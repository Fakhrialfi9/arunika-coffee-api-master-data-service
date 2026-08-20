import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (!process.env.DATABASE_URL && existsSync('.env')) {
  loadEnvFile('.env');
}

process.env.NODE_ENV ??= 'test';
process.env.APP_NAME ??= 'arunika-coffee-api-master-data-service';
process.env.APP_HOST ??= '127.0.0.1';
process.env.APP_PORT ??= '3000';
process.env.DATABASE_HOST ??= '127.0.0.1';
process.env.DATABASE_PORT ??= '3306';
process.env.DATABASE_NAME ??= 'arunika_coffee_master_data';
process.env.DATABASE_USER ??= 'ci';
process.env.DATABASE_PASSWORD ??= 'ci';
process.env.DATABASE_URL ??=
  'mysql://ci:ci@127.0.0.1:3306/arunika_coffee_master_data';
process.env.GRPC_MASTER_HOST ??= '127.0.0.1';
process.env.GRPC_MASTER_PORT ??= '50053';
process.env.MASTER_GRPC_TIMEOUT_MS ??= '3000';
process.env.SECURITY_CORS_ORIGINS ??= 'http://localhost:3000';
process.env.SECURITY_RATE_LIMIT_TTL ??= '60000';
process.env.SECURITY_RATE_LIMIT_MAX ??= '100';
process.env.SECURITY_BODY_LIMIT ??= '1mb';
process.env.SECURITY_GRPC_MAX_MESSAGE_BYTES ??= '1048576';
process.env.SECURITY_TRUST_PROXY ??= 'loopback';
process.env.LOG_ENABLED ??= 'true';
process.env.LOG_LEVEL ??= 'debug';
process.env.OTEL_SERVICE_NAME ??= 'arunika-coffee-api-master-data-service';
process.env.OTEL_TRACING_ENABLED ??= 'false';
process.env.OTEL_TRACES_SAMPLER_ARG ??= '1';
process.env.OTEL_METRICS_ENABLED ??= 'false';
process.env.OTEL_METRIC_EXPORT_INTERVAL ??= '60000';
