import { registerAs } from '@nestjs/config';

export interface AppConfig {
  name: string;
  environment: string;
  host: string;
  port: number;
  grpcMasterHost: string;
  grpcMasterPort: number;
  grpcTimeoutMs: number;
  securityGrpcMaxMessageBytes: number;
  databasePoolConnectionLimit: number;
  databaseConnectTimeoutMs: number;
  databaseAcquireTimeoutMs: number;
  databasePoolIdleTimeoutSec: number;
  logEnabled: boolean;
  logLevel: string;
  otelServiceName: string;
  otelTracingEnabled: boolean;
  otelTracesSamplerArg: number;
  otelMetricsEnabled: boolean;
  otelMetricExportInterval: number;
}

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

export const appConfig = registerAs('app', (): AppConfig => ({
  name: process.env.APP_NAME ?? 'arunika-coffee-api-master-data-service',
  environment: process.env.NODE_ENV ?? 'development',
  host: process.env.APP_HOST ?? '0.0.0.0',
  port: Number(process.env.APP_PORT ?? 3000),
  grpcMasterHost: process.env.GRPC_MASTER_HOST ?? '0.0.0.0',
  grpcMasterPort: Number(process.env.GRPC_MASTER_PORT ?? 50053),
  grpcTimeoutMs: Number(process.env.MASTER_GRPC_TIMEOUT_MS ?? 3000),
  securityGrpcMaxMessageBytes: Number(
    process.env.SECURITY_GRPC_MAX_MESSAGE_BYTES ?? 1024 * 1024,
  ),
  databasePoolConnectionLimit: Number(
    process.env.DATABASE_POOL_CONNECTION_LIMIT ?? 10,
  ),
  databaseConnectTimeoutMs: Number(
    process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 5000,
  ),
  databaseAcquireTimeoutMs: Number(
    process.env.DATABASE_ACQUIRE_TIMEOUT_MS ?? 10000,
  ),
  databasePoolIdleTimeoutSec: Number(
    process.env.DATABASE_POOL_IDLE_TIMEOUT_SEC ?? 300,
  ),
  logEnabled: toBoolean(process.env.LOG_ENABLED, true),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  otelServiceName:
    process.env.OTEL_SERVICE_NAME ??
    'arunika-coffee-api-master-data-service',
  otelTracingEnabled: toBoolean(process.env.OTEL_TRACING_ENABLED, true),
  otelTracesSamplerArg: Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? 1),
  otelMetricsEnabled: toBoolean(process.env.OTEL_METRICS_ENABLED, true),
  otelMetricExportInterval: Number(
    process.env.OTEL_METRIC_EXPORT_INTERVAL ?? 60000,
  ),
}));
