import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 32 coffee taxonomy', () => {
  it('verifies species, variety, and species-variety relationships', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const speciesCode = `STEP32-S-${suffix}`;
    const varietyCode = `STEP32-V-${suffix}`;

    let speciesId: string | undefined;
    let varietyId: string | undefined;

    try {
      await prisma.onModuleInit();

      const speciesColumns = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'species'
        ORDER BY ORDINAL_POSITION
      `;

      expect(speciesColumns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'code',
        'name',
        'commonName',
        'scientificName',
        'originRegion',
        'description',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      const varietyColumns = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'varieties'
        ORDER BY ORDINAL_POSITION
      `;

      expect(varietyColumns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'speciesId',
        'code',
        'name',
        'geneticBackground',
        'originCountry',
        'plantCharacteristics',
        'flavorCharacteristics',
        'description',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      expect(
        varietyColumns.find(({ columnName }) => columnName === 'speciesId')
          ?.isNullable,
      ).toBe('NO');

      const foreignKeys = await prisma.$queryRaw<
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
          AND TABLE_NAME = 'varieties'
          AND COLUMN_NAME = 'speciesId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(foreignKeys).toEqual([
        {
          columnName: 'speciesId',
          referencedTable: 'species',
          referencedColumn: 'id',
        },
      ]);

      const species = await prisma.species.create({
        data: {
          code: speciesCode,
          name: 'Step 32 Test Arabica',
          commonName: 'Arabica',
          scientificName: 'Coffea arabica',
        },
      });
      speciesId = species.id;

      expect(species.isActive).toBe(true);
      expect(species.sortOrder).toBe(0);

      const variety = await prisma.variety.create({
        data: {
          speciesId: species.id,
          code: varietyCode,
          name: 'Step 32 Test Caturra',
          originCountry: 'Colombia',
          plantCharacteristics: { height: 'medium' },
          flavorCharacteristics: { acidity: 'bright' },
        },
      });
      varietyId = variety.id;

      expect(variety.speciesId).toBe(species.id);
      expect(variety.isActive).toBe(true);
      expect(variety.sortOrder).toBe(0);

      const hierarchy = await prisma.species.findUnique({
        where: { id: species.id },
        include: { varieties: true },
      });

      expect(hierarchy?.varieties.map(({ id }) => id)).toEqual([variety.id]);
      expect(hierarchy?.varieties[0]?.speciesId).toBe(species.id);

      const reverseVariety = await prisma.variety.findUnique({
        where: { id: variety.id },
        include: { species: true },
      });

      expect(reverseVariety?.species.id).toBe(species.id);
      expect(reverseVariety?.species.code).toBe(speciesCode);

      await expect(
        prisma.species.create({
          data: {
            code: speciesCode,
            name: 'Step 32 Duplicate Species',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      await expect(
        prisma.variety.create({
          data: {
            speciesId: species.id,
            code: varietyCode,
            name: 'Step 32 Duplicate Variety',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      await expect(
        prisma.variety.create({
          data: {
            speciesId: randomUUID(),
            code: `STEP32-FK-${suffix}`,
            name: 'Step 32 Invalid Species Variety',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    } finally {
      if (varietyId !== undefined) {
        await prisma.variety.delete({ where: { id: varietyId } });
      }

      if (speciesId !== undefined) {
        await prisma.species.delete({ where: { id: speciesId } });
      }

      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
