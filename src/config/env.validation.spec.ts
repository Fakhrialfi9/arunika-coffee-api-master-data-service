import { describe, expect, it } from 'vitest';

import { validateEnvironment } from './env.validation.js';

const valid = (overrides: Record<string, unknown> = {}) => ({
  NODE_ENV: 'test',
  APP_NAME: 'arunika-coffee-api-master-data-service-test',
  APP_HOST: '127.0.0.1',
  APP_PORT: '3000',
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: '3306',
  DATABASE_NAME: 'arunika_coffee_master_data_test',
  DATABASE_USER: 'test',
  DATABASE_PASSWORD: 'test',
  DATABASE_URL:
    'mysql://test:test@127.0.0.1:3306/arunika_coffee_master_data_test',
  DATABASE_POOL_CONNECTION_LIMIT: '5',
  DATABASE_CONNECT_TIMEOUT_MS: '5000',
  DATABASE_ACQUIRE_TIMEOUT_MS: '10000',
  DATABASE_POOL_IDLE_TIMEOUT_SEC: '60',
  GRPC_MASTER_HOST: '127.0.0.1',
  GRPC_MASTER_PORT: '50053',
  MASTER_GRPC_TIMEOUT_MS: '3000',
  SECURITY_CORS_ORIGINS: 'http://localhost:3000',
  SECURITY_RATE_LIMIT_TTL: '60000',
  SECURITY_RATE_LIMIT_MAX: '1000',
  SECURITY_BODY_LIMIT: '1mb',
  SECURITY_GRPC_MAX_MESSAGE_BYTES: '1048576',
  SECURITY_TRUST_PROXY: 'loopback',
  LOG_ENABLED: 'false',
  LOG_LEVEL: 'warn',
  OTEL_SERVICE_NAME: 'arunika-coffee-api-master-data-service-test',
  OTEL_TRACING_ENABLED: 'false',
  OTEL_TRACES_SAMPLER_ARG: '0',
  OTEL_METRICS_ENABLED: 'false',
  OTEL_METRIC_EXPORT_INTERVAL: '60000',
  ...overrides,
});

describe('validateEnvironment', () => {
  it('accepts the test configuration contract', () => {
    expect(validateEnvironment(valid()).NODE_ENV).toBe('test');
  });

  it('rejects a database URL whose database differs from DATABASE_NAME', () => {
    expect(() =>
      validateEnvironment(
        valid({
          DATABASE_URL:
            'mysql://test:test@127.0.0.1:3306/another_database',
        }),
      ),
    ).toThrow('DATABASE_URL database name must match DATABASE_NAME');
  });

  it('rejects weak production credentials and localhost database endpoints', () => {
    expect(() =>
      validateEnvironment(
        valid({
          NODE_ENV: 'production',
          APP_HOST: '0.0.0.0',
          DATABASE_HOST: '127.0.0.1',
          DATABASE_URL:
            'mysql://dev:dev123@127.0.0.1:3306/arunika_coffee_master_data_test',
          DATABASE_NAME: 'arunika_coffee_master_data_test',
          DATABASE_USER: 'dev',
          DATABASE_PASSWORD: 'dev123',
          GRPC_MASTER_HOST: '10.0.0.10',
          SECURITY_CORS_ORIGINS: 'https://app.example.com',
          LOG_LEVEL: 'info',
          OTEL_TRACES_SAMPLER_ARG: '0.1',
        }),
      ),
    ).toThrow('DATABASE_HOST must not point to localhost in production');
  });

  it('rejects a sampler argument outside 0..1', () => {
    expect(() => validateEnvironment(valid({ OTEL_TRACES_SAMPLER_ARG: '2' }))).toThrow(
      'Environment validation failed',
    );
  });
});
