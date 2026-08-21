import 'dotenv/config';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { registerHooks } from 'node:module';
import { URL, fileURLToPath } from 'node:url';
import { accessSync } from 'node:fs';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL && specifier.endsWith('.js')) {
      const candidate = new URL(`${specifier.slice(0, -3)}.ts`, context.parentURL);

      try {
        accessSync(fileURLToPath(candidate));
        return nextResolve(candidate.href, context);
      } catch {
        // Fall through when a real JavaScript module is being imported.
      }
    }

    return nextResolve(specifier, context);
  },
});

const { PrismaClient } = await import('./generated/prisma/client.js');
const { seedMasterData } = await import('./seeds/index.js');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is not defined');

const url = new URL(databaseUrl);
const database = url.pathname.replace(/^\//, '');

if (!url.hostname || !database) throw new Error('DATABASE_URL is invalid');

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || process.env.DATABASE_PORT || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database,
  connectionLimit: Number(process.env.DATABASE_POOL_CONNECTION_LIMIT ?? 10),
  connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 5000),
  acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT_MS ?? 10000),
  idleTimeout: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_SEC ?? 300),
});

const prisma = new PrismaClient({ adapter });

try {
  await seedMasterData(prisma);
  console.log('Master data seed completed successfully.');
} finally {
  await prisma.$disconnect();
}
