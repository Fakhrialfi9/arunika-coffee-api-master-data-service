import { describe, expect, it } from 'vitest';

import { validateEnvironment } from '../../src/config/env.validation.js';

const validEnvironment = {
  NODE_ENV: 'test',
  APP_NAME: 'arunika-coffee-api-master-data-service',
  APP_HOST: '127.0.0.1',
  APP_PORT: '3000',
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: '3306',
  DATABASE_NAME: 'arunika_coffee_master_data',
  DATABASE_USER: 'ci',
  DATABASE_PASSWORD: 'ci',
  DATABASE_URL: 'mysql://ci:ci@127.0.0.1:3306/arunika_coffee_master_data',
  GRPC_MASTER_HOST: '127.0.0.1',
  GRPC_MASTER_PORT: '50053',
  SECURITY_CORS_ORIGINS: 'http://localhost:3000',
  OTEL_SERVICE_NAME: 'arunika-coffee-api-master-data-service',
};

describe('Step 26 security foundation', () => {
  it('accepts the test environment baseline', () => {
    expect(validateEnvironment(validEnvironment).DATABASE_NAME).toBe(
      'arunika_coffee_master_data',
    );
  });

  it('rejects localhost database configuration in production', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
      }),
    ).toThrow('DATABASE_HOST must not point to localhost in production');
  });

  it('rejects local gRPC binding in production', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
        DATABASE_HOST: 'db.internal',
        DATABASE_URL: 'mysql://app:strong-secret@db.internal:3306/arunika_coffee_master_data',
        DATABASE_USER: 'app',
        DATABASE_PASSWORD: 'strong-secret',
        APP_HOST: '0.0.0.0',
        GRPC_MASTER_HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        SECURITY_CORS_ORIGINS: 'https://example.com',
      }),
    ).toThrow('GRPC_MASTER_HOST must not bind to localhost in production');
  });
});
