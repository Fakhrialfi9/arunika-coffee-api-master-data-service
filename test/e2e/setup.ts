import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (!process.env.DATABASE_URL && existsSync('.env')) {
  loadEnvFile('.env');
}
