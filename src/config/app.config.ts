import { registerAs } from '@nestjs/config';

export interface AppConfig {
  readonly name: string;
  readonly environment: 'development' | 'test' | 'production';
  readonly host: string;
  readonly port: number;
  readonly grpcHost: string;
  readonly grpcPort: number;
  readonly databaseName: string;
}

const parsePort = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid port value: ${value}`);
  }

  return port;
};

const parseEnvironment = (
  value: string | undefined,
): AppConfig['environment'] => {
  if (value === 'test' || value === 'production') {
    return value;
  }

  return 'development';
};

export const appConfig = registerAs('app', (): AppConfig => ({
  name: process.env.APP_NAME ?? 'master-data-service',
  environment: parseEnvironment(process.env.NODE_ENV),
  host: process.env.APP_HOST ?? '127.0.0.1',
  port: parsePort(process.env.APP_PORT, 3000),
  grpcHost: process.env.GRPC_HOST ?? '127.0.0.1',
  grpcPort: parsePort(process.env.GRPC_PORT, 50051),
  databaseName: process.env.DB_NAME ?? 'arunika_coffee_master_data',
}));
