import 'dotenv/config';

import { accessSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client.js';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL && specifier.startsWith('./') && specifier.endsWith('.js')) {
      const tsSpecifier = `${specifier.slice(0, -3)}.ts`;
      const candidate = new URL(tsSpecifier, context.parentURL);

      try {
        accessSync(fileURLToPath(candidate));
        return nextResolve(candidate.href, context);
      } catch {
        // Fall through to the normal ESM resolver for real .js modules.
      }
    }

    return nextResolve(specifier, context);
  },
});

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
