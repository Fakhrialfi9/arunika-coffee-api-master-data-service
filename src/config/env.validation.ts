import 'reflect-metadata';

import { plainToInstance, Type } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const WEAK_PRODUCTION_SECRETS = new Set([
  'dev',
  'dev123',
  'password',
  'password123',
  'secret',
  'changeme',
]);

class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsString()
  @IsNotEmpty()
  APP_NAME!: string;

  @IsString()
  @IsNotEmpty()
  APP_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  APP_PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT = 3306;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER!: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD!: string;

  @IsUrl({ require_tld: false, protocols: ['mysql'] })
  DATABASE_URL!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  DATABASE_POOL_CONNECTION_LIMIT = 10;

  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(60000)
  DATABASE_CONNECT_TIMEOUT_MS = 5000;

  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(60000)
  DATABASE_ACQUIRE_TIMEOUT_MS = 10000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3600)
  DATABASE_POOL_IDLE_TIMEOUT_SEC = 300;

  @IsString()
  @IsNotEmpty()
  GRPC_MASTER_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  GRPC_MASTER_PORT = 50053;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  MASTER_GRPC_TIMEOUT_MS = 3000;

  @IsString()
  @IsNotEmpty()
  SECURITY_CORS_ORIGINS!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  SECURITY_RATE_LIMIT_TTL = 60000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  SECURITY_RATE_LIMIT_MAX = 100;

  @Matches(/^\d+(?:kb|mb)$/i)
  SECURITY_BODY_LIMIT = '1mb';

  @Type(() => Number)
  @IsInt()
  @Min(1024)
  @Max(1024 * 1024)
  SECURITY_GRPC_MAX_MESSAGE_BYTES = 1024 * 1024;

  @IsString()
  @IsNotEmpty()
  SECURITY_TRUST_PROXY = 'loopback';

  @IsBooleanString()
  LOG_ENABLED = 'true';

  @IsString()
  @IsNotEmpty()
  LOG_LEVEL = 'debug';

  @IsString()
  @IsNotEmpty()
  OTEL_SERVICE_NAME!: string;

  @IsBooleanString()
  OTEL_TRACING_ENABLED = 'true';

  @IsNumberString()
  OTEL_TRACES_SAMPLER_ARG = '1';

  @IsBooleanString()
  OTEL_METRICS_ENABLED = 'true';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  OTEL_METRIC_EXPORT_INTERVAL = 60000;
}

function validateProductionEnvironment(config: EnvironmentVariables): void {
  const databaseUrl = new URL(config.DATABASE_URL);
  const databasePassword = config.DATABASE_PASSWORD.trim().toLowerCase();
  const databaseUser = config.DATABASE_USER.trim().toLowerCase();
  const corsOrigins = config.SECURITY_CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().toLowerCase())
    .filter(Boolean);

  if (LOCAL_HOSTS.has(config.DATABASE_HOST.toLowerCase())) {
    throw new Error('DATABASE_HOST must not point to localhost in production');
  }

  if (LOCAL_HOSTS.has(databaseUrl.hostname.toLowerCase())) {
    throw new Error('DATABASE_URL must not point to localhost in production');
  }

  if (databaseUser === 'root' || WEAK_PRODUCTION_SECRETS.has(databaseUser)) {
    throw new Error('DATABASE_USER must use a dedicated production credential');
  }

  if (WEAK_PRODUCTION_SECRETS.has(databasePassword)) {
    throw new Error('DATABASE_PASSWORD must use a strong production secret');
  }

  if (config.APP_HOST !== '0.0.0.0') {
    throw new Error('APP_HOST must be 0.0.0.0 in production');
  }

  if (LOCAL_HOSTS.has(config.GRPC_MASTER_HOST.toLowerCase())) {
    throw new Error(
      'GRPC_MASTER_HOST must not bind to localhost in production',
    );
  }

  if (config.LOG_LEVEL === 'debug' || config.LOG_LEVEL === 'verbose') {
    throw new Error('LOG_LEVEL must not be debug or verbose in production');
  }

  if (
    corsOrigins.some(
      (origin) => origin.includes('localhost') || origin.includes('127.0.0.1'),
    )
  ) {
    throw new Error(
      'SECURITY_CORS_ORIGINS must not contain local development origins in production',
    );
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  if (validatedConfig.NODE_ENV === NodeEnvironment.Production) {
    validateProductionEnvironment(validatedConfig);
  }

  return validatedConfig;
}
