import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

process.env.NODE_ENV = 'test';

if (existsSync('.env.test')) {
  loadEnvFile('.env.test');
} else if (existsSync('.env') && !process.env.DATABASE_URL) {
  loadEnvFile('.env');
}

const currentDatabaseUrl = process.env.DATABASE_URL ?? '';

if (!currentDatabaseUrl.includes('arunika_coffee_master_data_test')) {
  const host = process.env.TEST_DATABASE_HOST ?? '127.0.0.1';
  const port = process.env.TEST_DATABASE_PORT ?? '3306';
  const user = process.env.TEST_DATABASE_USER ?? 'test';
  const password = process.env.TEST_DATABASE_PASSWORD ?? 'test';
  const database = 'arunika_coffee_master_data_test';

  process.env.DATABASE_HOST = host;
  process.env.DATABASE_PORT = port;
  process.env.DATABASE_NAME = database;
  process.env.DATABASE_USER = user;
  process.env.DATABASE_PASSWORD = password;
  process.env.DATABASE_URL = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}
