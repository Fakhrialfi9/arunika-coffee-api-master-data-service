import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 29 geography master data', () => {
  it('verifies the country-region hierarchy and origin semantics', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const countryCode = `STEP29-${suffix}`;
    const originCountryCode = `S29O-${suffix}`;
    const regionCodeA = `S29RA-${suffix}`;
    const regionCodeB = `S29RB-${suffix}`;
    const originRegionCode = `S29RO-${suffix}`;

    let countryId: string | undefined;
    let originCountryId: string | undefined;

    try {
      await prisma.onModuleInit();

      const countryColumns = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'regions'
          AND COLUMN_NAME = 'countryId'
      `;

      expect(countryColumns).toEqual([
        { columnName: 'countryId', isNullable: 'NO' },
      ]);

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
          AND TABLE_NAME = 'regions'
          AND COLUMN_NAME = 'countryId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(foreignKeys).toContainEqual({
        columnName: 'countryId',
        referencedTable: 'countries',
        referencedColumn: 'id',
      });

      const country = await prisma.country.create({
        data: {
          code: countryCode,
          name: 'Step 29 Test Country',
          iso2: `X${suffix.slice(0, 1)}`,
          iso3: `S29${suffix.slice(0, 2)}`,
        },
      });
      countryId = country.id;

      expect(country.isCoffeeOrigin).toBe(false);
      expect(country.isActive).toBe(true);

      const originCountry = await prisma.country.create({
        data: {
          code: originCountryCode,
          name: 'Step 29 Origin Country',
          iso2: `Y${suffix.slice(0, 1)}`,
          iso3: `O29${suffix.slice(0, 2)}`,
          isCoffeeOrigin: true,
        },
      });
      originCountryId = originCountry.id;

      const [regionA, regionB, originRegion] = await Promise.all([
        prisma.region.create({
          data: {
            countryId: country.id,
            code: regionCodeA,
            name: 'Step 29 Region A',
          },
        }),
        prisma.region.create({
          data: {
            countryId: country.id,
            code: regionCodeB,
            name: 'Step 29 Region B',
          },
        }),
        prisma.region.create({
          data: {
            countryId: originCountry.id,
            code: originRegionCode,
            name: 'Step 29 Origin Region',
          },
        }),
      ]);

      const hierarchy = await prisma.country.findUnique({
        where: { id: country.id },
        include: { regions: { orderBy: { code: 'asc' } } },
      });

      expect(hierarchy?.regions.map(({ id }) => id)).toEqual(
        [regionA.id, regionB.id].sort(),
      );
      expect(
        hierarchy?.regions.every(
          ({ countryId: parentId }) => parentId === country.id,
        ),
      ).toBe(true);

      const originHierarchy = await prisma.country.findUnique({
        where: { id: originCountry.id },
        include: { regions: true },
      });

      expect(originHierarchy?.isCoffeeOrigin).toBe(true);
      expect(originHierarchy?.regions.map(({ id }) => id)).toEqual([
        originRegion.id,
      ]);

      await expect(
        prisma.region.create({
          data: {
            countryId: randomUUID(),
            code: `S29FK-${suffix}`,
            name: 'Step 29 Invalid Region',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    } finally {
      if (countryId !== undefined) {
        await prisma.region.deleteMany({ where: { countryId } });
        await prisma.country.delete({ where: { id: countryId } });
      }

      if (originCountryId !== undefined) {
        await prisma.region.deleteMany({ where: { countryId: originCountryId } });
        await prisma.country.delete({ where: { id: originCountryId } });
      }

      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
