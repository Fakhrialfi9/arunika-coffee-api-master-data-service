import { loadEnvFile } from 'node:process';

import { defineConfig, env } from 'prisma/config';

try {
  loadEnvFile('.env');
} catch {
  // Environment variables may be provided by the runtime in CI/production.
}

export default defineConfig({
  schema: 'prisma/schema',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});
