import { describe, expect, it } from 'vitest';

import { validateEnvironment } from '../../src/config/env.validation.js';

const validEnvironment = {
  NODE_ENV: 'test',
  APP_NAME: 'arunika-coffee-api-master-data-service',
  APP_HOST: '127.0.0.1',
  APP_PORT: '3000',
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: '3306',
  DATABASE_NAME: 'arunika_coffee_master_data_test',
  DATABASE_USER: 'ci',
  DATABASE_PASSWORD: 'ci',
  DATABASE_URL: 'mysql://ci:ci@127.0.0.1:3306/arunika_coffee_master_data_test',
  GRPC_MASTER_HOST: '127.0.0.1',
  GRPC_MASTER_PORT: '50053',
  SECURITY_CORS_ORIGINS: 'http://localhost:3000',
  SECURITY_BODY_LIMIT: '1mb',
  SECURITY_GRPC_MAX_MESSAGE_BYTES: '1048576',
  OTEL_SERVICE_NAME: 'arunika-coffee-api-master-data-service',
};

describe('Step 80 security hardening', () => {
  it('accepts the 1 MB payload baseline and gRPC message limit', () => {
    const config = validateEnvironment(validEnvironment);
    expect(config.SECURITY_BODY_LIMIT).toBe('1mb');
    expect(config.SECURITY_GRPC_MAX_MESSAGE_BYTES).toBe(1024 * 1024);
  });

  it('rejects oversized gRPC messages', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        SECURITY_GRPC_MAX_MESSAGE_BYTES: '1048577',
      }),
    ).toThrow('Environment validation failed');
  });

  it('rejects malformed body limit configuration', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        SECURITY_BODY_LIMIT: 'unlimited',
      }),
    ).toThrow('Environment validation failed');
  });

  it('rejects malicious application list input before it reaches persistence', async () => {
    const { MasterDataCrudService } =
      await import('../../src/application/master-data/services/master-data-crud.service.js');
    const repository = { list: async () => ({}) };
    const factory = { get: () => repository } as never;
    const service = new MasterDataCrudService(factory);

    await expect(
      service.list('country', {
        search: "' OR 1=1 --",
        sortBy: 'name; DROP TABLE countries',
      }),
    ).rejects.toThrow('Unsupported master-data sort field');
  });

  it('does not expose database credentials through validation errors', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        DATABASE_URL: 'not-a-mysql-url-with-secret-password',
      }),
    ).toThrow((error: Error) => {
      expect(error.message).not.toContain('ci:ci');
      return true;
    });
  });
});
