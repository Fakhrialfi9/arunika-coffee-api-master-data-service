import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

const EXPECTED_TABLES = [
  'certifications',
  'coffee_beans',
  'coffee_grades',
  'countries',
  'farmers',
  'farms',
  'flavor_profiles',
  'harvest_seasons',
  'organizations',
  'processing_methods',
  'regions',
  'sensory_profile_flavors',
  'sensory_profiles',
  'species',
  'varieties',
] as const;

describe('Step 28 database foundation', () => {
  it('connects to the configured Master Data database and verifies the schema foundation', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    const configuredDatabase = process.env.DATABASE_NAME;

    expect(databaseUrl).toBeTruthy();
    expect(configuredDatabase).toBeTruthy();

    const url = new URL(databaseUrl!);
    const databaseFromUrl = decodeURIComponent(url.pathname.replace(/^\//, ''));

    expect(databaseFromUrl).toBe(configuredDatabase);

    const prisma = new PrismaService();

    try {
      await prisma.onModuleInit();

      const databaseRows = await prisma.$queryRaw<Array<{ databaseName: string }>>`
        SELECT DATABASE() AS databaseName
      `;

      expect(databaseRows[0]?.databaseName).toBe(configuredDatabase);

      const tableRows = await prisma.$queryRaw<Array<{ tableName: string }>>`
        SELECT TABLE_NAME AS tableName
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE'
      `;

      const actualTables = new Set(tableRows.map(({ tableName }) => tableName));

      for (const tableName of EXPECTED_TABLES) {
        expect(actualTables.has(tableName), `Missing table: ${tableName}`).toBe(true);
      }

      expect(actualTables.has('_prisma_migrations')).toBe(true);

      const migrationRows = await prisma.$queryRaw<Array<{ appliedCount: bigint }>>`
        SELECT COUNT(*) AS appliedCount
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
          AND rolled_back_at IS NULL
      `;

      expect(Number(migrationRows[0]?.appliedCount ?? 0)).toBeGreaterThan(0);
    } finally {
      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
