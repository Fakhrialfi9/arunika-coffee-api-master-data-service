import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 34 harvest season master data', () => {
  it('verifies harvest season schema, year semantics, current-season state, and coffee bean relationship', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const seasonUuid = randomUUID();
    const seasonName = `Step 34 Harvest ${suffix}`;

    let seasonId: string | undefined;

    try {
      await prisma.onModuleInit();

      const columns = await prisma.$queryRaw<
        Array<{
          columnName: string;
          isNullable: string;
          columnDefault: string | null;
        }>
      >`
        SELECT
          COLUMN_NAME AS columnName,
          IS_NULLABLE AS isNullable,
          COLUMN_DEFAULT AS columnDefault
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'harvest_seasons'
        ORDER BY ORDINAL_POSITION
      `;

      expect(columns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'name',
        'label',
        'year',
        'seasonType',
        'startMonth',
        'endMonth',
        'isCurrent',
        'description',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      expect(
        columns.find(({ columnName }) => columnName === 'year')?.isNullable,
      ).toBe('NO');
      expect(
        columns.find(({ columnName }) => columnName === 'isCurrent')
          ?.columnDefault,
      ).toBe('0');
      expect(
        columns.find(({ columnName }) => columnName === 'isActive')
          ?.columnDefault,
      ).toBe('1');
      expect(
        columns.find(({ columnName }) => columnName === 'sortOrder')
          ?.columnDefault,
      ).toBe('0');

      const yearIndexes = await prisma.$queryRaw<
        Array<{ indexName: string; columnName: string }>
      >`
        SELECT
          INDEX_NAME AS indexName,
          COLUMN_NAME AS columnName
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'harvest_seasons'
          AND COLUMN_NAME = 'year'
      `;

      expect(yearIndexes.length).toBeGreaterThan(0);

      const coffeeBeanForeignKeys = await prisma.$queryRaw<
        Array<{
          columnName: string;
          referencedTable: string;
          referencedColumn: string;
        }>
      >`
        SELECT
          COLUMN_NAME AS columnName,
          REFERENCED_TABLE_NAME AS referencedTable,
          REFERENCED_COLUMN_NAME AS referencedColumn
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'coffee_beans'
          AND COLUMN_NAME = 'harvestSeasonId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(coffeeBeanForeignKeys).toEqual([
        {
          columnName: 'harvestSeasonId',
          referencedTable: 'harvest_seasons',
          referencedColumn: 'id',
        },
      ]);

      const season = await prisma.harvestSeason.create({
        data: {
          uuid: seasonUuid,
          name: seasonName,
          label: `Harvest 2026/${suffix}`,
          year: 2026,
          seasonType: 'Main',
          startMonth: 10,
          endMonth: 4,
          isCurrent: true,
          description: 'Step 34 cross-year harvest season',
        },
      });
      seasonId = season.id;

      expect(season.year).toBe(2026);
      expect(season.startMonth).toBe(10);
      expect(season.endMonth).toBe(4);
      expect(season.isCurrent).toBe(true);
      expect(season.isActive).toBe(true);
      expect(season.sortOrder).toBe(0);

      const seasonWithBeans = await prisma.harvestSeason.findUnique({
        where: { id: season.id },
        include: { coffeeBeans: true },
      });
      expect(seasonWithBeans?.coffeeBeans).toEqual([]);

      await expect(
        prisma.harvestSeason.create({
          data: {
            uuid: seasonUuid,
            name: 'Duplicate Harvest Season',
            year: 2026,
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      if (seasonId !== undefined) {
        await prisma.harvestSeason.delete({ where: { id: seasonId } });
      }

      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
