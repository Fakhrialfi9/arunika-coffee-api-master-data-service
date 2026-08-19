import 'dotenv/config';

import { defineConfig } from 'prisma/config';

const databaseUrl =
  process.env.DATABASE_URL ??
  'mysql://dev:dev123@127.0.0.1:3306/arunika_coffee_master_data';

export default defineConfig({
  schema: 'prisma/schema',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url: databaseUrl,
  },
});
