import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 30 organization master data', () => {
  it('verifies organization-region ownership and organization constraints', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const countryCode = `STEP30-C-${suffix}`;
    const regionCode = `STEP30-R-${suffix}`;
    const organizationCode = `STEP30-O-${suffix}`;

    let countryId: string | undefined;
    let regionId: string | undefined;
    let organizationId: string | undefined;

    try {
      await prisma.onModuleInit();

      const organizationRegionColumn = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'organizations'
          AND COLUMN_NAME = 'regionId'
      `;

      expect(organizationRegionColumn).toEqual([
        { columnName: 'regionId', isNullable: 'NO' },
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
          AND TABLE_NAME = 'organizations'
          AND COLUMN_NAME = 'regionId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(foreignKeys).toContainEqual({
        columnName: 'regionId',
        referencedTable: 'regions',
        referencedColumn: 'id',
      });

      const country = await prisma.country.create({
        data: {
          code: countryCode,
          name: 'Step 30 Test Country',
          iso2: `C${suffix.slice(0, 1)}`,
          iso3: `O30${suffix.slice(0, 2)}`,
        },
      });
      countryId = country.id;

      const region = await prisma.region.create({
        data: {
          countryId: country.id,
          code: regionCode,
          name: 'Step 30 Test Region',
        },
      });
      regionId = region.id;

      const organization = await prisma.organization.create({
        data: {
          code: organizationCode,
          name: 'Step 30 Test Organization',
          type: 'cooperative',
          regionId: region.id,
        },
      });
      organizationId = organization.id;

      expect(organization.isActive).toBe(true);
      expect(organization.sortOrder).toBe(0);

      const hierarchy = await prisma.organization.findUnique({
        where: { id: organization.id },
        include: { region: true },
      });

      expect(hierarchy?.region.id).toBe(region.id);
      expect(hierarchy?.region.countryId).toBe(country.id);

      const reverseHierarchy = await prisma.region.findUnique({
        where: { id: region.id },
        include: { organizations: true },
      });

      expect(reverseHierarchy?.organizations.map(({ id }) => id)).toEqual([
        organization.id,
      ]);

      await expect(
        prisma.organization.create({
          data: {
            code: organizationCode,
            name: 'Step 30 Duplicate Organization',
            type: 'cooperative',
            regionId: region.id,
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      await expect(
        prisma.organization.create({
          data: {
            code: `STEP30-FK-${suffix}`,
            name: 'Step 30 Invalid Organization',
            type: 'cooperative',
            regionId: randomUUID(),
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    } finally {
      if (organizationId !== undefined) {
        await prisma.organization.delete({ where: { id: organizationId } });
      }

      if (regionId !== undefined) {
        await prisma.region.delete({ where: { id: regionId } });
      }

      if (countryId !== undefined) {
        await prisma.country.delete({ where: { id: countryId } });
      }

      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
