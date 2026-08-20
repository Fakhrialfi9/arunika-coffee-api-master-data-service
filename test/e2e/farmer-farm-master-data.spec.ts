import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const toAlphabeticCode = (seed: bigint, length: number): string => {
  let value = seed;
  let code = '';

  for (let index = 0; index < length; index += 1) {
    code = ALPHABET[Number(value % 26n)] + code;
    value /= 26n;
  }

  return code;
};

describe('Step 31 farmer and farm master data', () => {
  it('verifies farmer-region, farmer-organization, and farm-farmer relationships', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const countryCode = `STEP31-C-${suffix}`;
    const regionCode = `STEP31-R-${suffix}`;
    const organizationCode = `STEP31-O-${suffix}`;
    const farmerCode = `STEP31-F-${suffix}`;

    let countryId: string | undefined;
    let regionId: string | undefined;
    let organizationId: string | undefined;
    let farmerId: string | undefined;
    let farmId: string | undefined;

    try {
      await prisma.onModuleInit();

      const farmerRegionColumn = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'farmers'
          AND COLUMN_NAME IN ('regionId', 'organizationId')
        ORDER BY ORDINAL_POSITION
      `;

      expect(farmerRegionColumn).toEqual([
        { columnName: 'regionId', isNullable: 'NO' },
        { columnName: 'organizationId', isNullable: 'YES' },
      ]);

      const farmFarmerColumn = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'farms'
          AND COLUMN_NAME = 'farmerId'
      `;

      expect(farmFarmerColumn).toEqual([
        { columnName: 'farmerId', isNullable: 'NO' },
      ]);

      const farmerForeignKeys = await prisma.$queryRaw<
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
          AND TABLE_NAME = 'farmers'
          AND COLUMN_NAME IN ('regionId', 'organizationId')
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(farmerForeignKeys).toContainEqual({
        columnName: 'regionId',
        referencedTable: 'regions',
        referencedColumn: 'id',
      });
      expect(farmerForeignKeys).toContainEqual({
        columnName: 'organizationId',
        referencedTable: 'organizations',
        referencedColumn: 'id',
      });

      const farmForeignKeys = await prisma.$queryRaw<
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
          AND TABLE_NAME = 'farms'
          AND COLUMN_NAME = 'farmerId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(farmForeignKeys).toEqual([
        {
          columnName: 'farmerId',
          referencedTable: 'farmers',
          referencedColumn: 'id',
        },
      ]);

      const existingCountryCodes = await prisma.country.findMany({
        select: { iso2: true, iso3: true },
      });
      const usedIso2 = new Set(existingCountryCodes.map(({ iso2 }) => iso2));
      const usedIso3 = new Set(existingCountryCodes.map(({ iso3 }) => iso3));
      const seed = BigInt(`0x${suffix}`);

      let iso2 = '';
      let iso3 = '';
      for (let offset = 0n; offset < 17_576n; offset += 1n) {
        const candidateIso2 = toAlphabeticCode(seed + offset, 2);
        const candidateIso3 = toAlphabeticCode(seed + offset, 3);

        if (!usedIso2.has(candidateIso2) && !usedIso3.has(candidateIso3)) {
          iso2 = candidateIso2;
          iso3 = candidateIso3;
          break;
        }
      }

      expect(iso2).toHaveLength(2);
      expect(iso3).toHaveLength(3);

      const country = await prisma.country.create({
        data: {
          code: countryCode,
          name: 'Step 31 Test Country',
          iso2,
          iso3,
        },
      });
      countryId = country.id;

      const region = await prisma.region.create({
        data: {
          countryId: country.id,
          code: regionCode,
          name: 'Step 31 Test Region',
        },
      });
      regionId = region.id;

      const organization = await prisma.organization.create({
        data: {
          code: organizationCode,
          name: 'Step 31 Test Organization',
          type: 'cooperative',
          regionId: region.id,
        },
      });
      organizationId = organization.id;

      const farmer = await prisma.farmer.create({
        data: {
          code: farmerCode,
          name: 'Step 31 Test Farmer',
          type: 'smallholder',
          regionId: region.id,
          organizationId: organization.id,
        },
      });
      farmerId = farmer.id;

      expect(farmer.isActive).toBe(true);
      expect(farmer.sortOrder).toBe(0);

      const farm = await prisma.farm.create({
        data: {
          name: 'Step 31 Test Farm',
          farmerId: farmer.id,
        },
      });
      farmId = farm.id;

      expect(farm.areaUnit).toBe('hectare');
      expect(farm.altitudeUnit).toBe('MASL');
      expect(farm.isActive).toBe(true);
      expect(farm.sortOrder).toBe(0);

      const hierarchy = await prisma.farmer.findUnique({
        where: { id: farmer.id },
        include: { region: true, organization: true, farms: true },
      });

      expect(hierarchy?.region.id).toBe(region.id);
      expect(hierarchy?.region.countryId).toBe(country.id);
      expect(hierarchy?.organization?.id).toBe(organization.id);
      expect(hierarchy?.farms.map(({ id }) => id)).toEqual([farm.id]);

      const reverseOrganization = await prisma.organization.findUnique({
        where: { id: organization.id },
        include: { farmers: true },
      });
      expect(reverseOrganization?.farmers.map(({ id }) => id)).toEqual([
        farmer.id,
      ]);

      const reverseRegion = await prisma.region.findUnique({
        where: { id: region.id },
        include: { farmers: true },
      });
      expect(reverseRegion?.farmers.map(({ id }) => id)).toEqual([farmer.id]);

      const reverseFarm = await prisma.farm.findUnique({
        where: { id: farm.id },
        include: { farmer: true },
      });
      expect(reverseFarm?.farmer.id).toBe(farmer.id);

      await expect(
        prisma.farmer.create({
          data: {
            code: farmerCode,
            name: 'Step 31 Duplicate Farmer',
            type: 'smallholder',
            regionId: region.id,
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      await expect(
        prisma.farmer.create({
          data: {
            code: `STEP31-FK-R-${suffix}`,
            name: 'Step 31 Invalid Region Farmer',
            type: 'smallholder',
            regionId: randomUUID(),
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });

      await expect(
        prisma.farmer.create({
          data: {
            code: `STEP31-FK-O-${suffix}`,
            name: 'Step 31 Invalid Organization Farmer',
            type: 'smallholder',
            regionId: region.id,
            organizationId: randomUUID(),
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });

      await expect(
        prisma.farm.create({
          data: {
            name: 'Step 31 Invalid Farmer Farm',
            farmerId: randomUUID(),
          },
        }),
      ).rejects.toMatchObject({ code: 'P2003' });
    } finally {
      if (farmId !== undefined) {
        await prisma.farm.delete({ where: { id: farmId } });
      }

      if (farmerId !== undefined) {
        await prisma.farmer.delete({ where: { id: farmerId } });
      }

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
