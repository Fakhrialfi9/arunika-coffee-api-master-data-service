import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 37 coffee bean master schema', () => {
  it('verifies coffee bean schema and the complete dependency relationship graph', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();

    let coffeeBeanId: string | undefined;
    let farmId: string | undefined;
    let farmerId: string | undefined;
    let varietyId: string | undefined;
    let speciesId: string | undefined;
    let regionId: string | undefined;
    let countryId: string | undefined;
    let processingMethodId: string | undefined;
    let gradeId: string | undefined;
    let harvestSeasonId: string | undefined;

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
          AND TABLE_NAME = 'coffee_beans'
        ORDER BY ORDINAL_POSITION
      `;

      expect(columns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'code',
        'lotNumber',
        'name',
        'description',
        'regionId',
        'farmerId',
        'farmId',
        'speciesId',
        'varietyId',
        'processingMethodId',
        'gradeId',
        'harvestSeasonId',
        'cuppingScore',
        'moisture',
        'density',
        'beanSize',
        'qualityStatus',
        'flavorProfiles',
        'aromaNotes',
        'availableWeight',
        'reservedWeight',
        'weightUnit',
        'isFeatured',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      const requiredColumns = [
        'regionId',
        'speciesId',
        'processingMethodId',
        'name',
        'code',
        'uuid',
      ];

      for (const columnName of requiredColumns) {
        expect(
          columns.find(({ columnName: current }) => current === columnName)
            ?.isNullable,
        ).toBe('NO');
      }

      expect(
        columns.find(({ columnName }) => columnName === 'weightUnit')
          ?.columnDefault,
      ).toBe('kg');
      expect(
        columns.find(({ columnName }) => columnName === 'isFeatured')
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
          AND TABLE_NAME = 'coffee_beans'
          AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY ORDINAL_POSITION
      `;

      expect(foreignKeys).toEqual([
        {
          columnName: 'regionId',
          referencedTable: 'regions',
          referencedColumn: 'id',
        },
        {
          columnName: 'farmerId',
          referencedTable: 'farmers',
          referencedColumn: 'id',
        },
        {
          columnName: 'farmId',
          referencedTable: 'farms',
          referencedColumn: 'id',
        },
        {
          columnName: 'speciesId',
          referencedTable: 'species',
          referencedColumn: 'id',
        },
        {
          columnName: 'varietyId',
          referencedTable: 'varieties',
          referencedColumn: 'id',
        },
        {
          columnName: 'processingMethodId',
          referencedTable: 'processing_methods',
          referencedColumn: 'id',
        },
        {
          columnName: 'gradeId',
          referencedTable: 'coffee_grades',
          referencedColumn: 'id',
        },
        {
          columnName: 'harvestSeasonId',
          referencedTable: 'harvest_seasons',
          referencedColumn: 'id',
        },
      ]);

      const country = await prisma.country.create({
        data: {
          uuid: randomUUID(),
          code: `STEP37-COUNTRY-${suffix}`,
          name: `Step 37 Country ${suffix}`,
          iso2: `S${suffix.slice(0, 1)}`,
          iso3: `S37${suffix.slice(0, 1)}`,
          isCoffeeOrigin: true,
        },
      });
      countryId = country.id;

      const region = await prisma.region.create({
        data: {
          uuid: randomUUID(),
          countryId: country.id,
          code: `STEP37-REGION-${suffix}`,
          name: `Step 37 Region ${suffix}`,
        },
      });
      regionId = region.id;

      const farmer = await prisma.farmer.create({
        data: {
          uuid: randomUUID(),
          code: `STEP37-FARMER-${suffix}`,
          name: `Step 37 Farmer ${suffix}`,
          type: 'individual',
          regionId: region.id,
        },
      });
      farmerId = farmer.id;

      const farm = await prisma.farm.create({
        data: {
          uuid: randomUUID(),
          name: `Step 37 Farm ${suffix}`,
          farmerId: farmer.id,
        },
      });
      farmId = farm.id;

      const species = await prisma.species.create({
        data: {
          uuid: randomUUID(),
          code: `STEP37-SPECIES-${suffix}`,
          name: `Step 37 Species ${suffix}`,
        },
      });
      speciesId = species.id;

      const variety = await prisma.variety.create({
        data: {
          uuid: randomUUID(),
          speciesId: species.id,
          code: `STEP37-VARIETY-${suffix}`,
          name: `Step 37 Variety ${suffix}`,
        },
      });
      varietyId = variety.id;

      const processingMethod = await prisma.processingMethod.create({
        data: {
          uuid: randomUUID(),
          code: `STEP37-PROCESS-${suffix}`,
          name: `Step 37 Processing ${suffix}`,
        },
      });
      processingMethodId = processingMethod.id;

      const grade = await prisma.coffeeGrade.create({
        data: {
          uuid: randomUUID(),
          code: `STEP37-GRADE-${suffix}`,
          name: `Step 37 Grade ${suffix}`,
        },
      });
      gradeId = grade.id;

      const harvestSeason = await prisma.harvestSeason.create({
        data: {
          uuid: randomUUID(),
          name: `Step 37 Harvest ${suffix}`,
          year: 2026,
        },
      });
      harvestSeasonId = harvestSeason.id;

      const coffeeBean = await prisma.coffeeBean.create({
        data: {
          uuid: randomUUID(),
          code: `STEP37-BEAN-${suffix}`,
          lotNumber: `LOT-${suffix}`,
          name: `Step 37 Coffee Bean ${suffix}`,
          description: 'Coffee Bean relationship graph verification',
          regionId: region.id,
          farmerId: farmer.id,
          farmId: farm.id,
          speciesId: species.id,
          varietyId: variety.id,
          processingMethodId: processingMethod.id,
          gradeId: grade.id,
          harvestSeasonId: harvestSeason.id,
          cuppingScore: 87.5,
          moisture: 10.5,
          density: 0.72,
          beanSize: '16+',
          qualityStatus: 'export-ready',
          flavorProfiles: ['chocolate', 'caramel'],
          aromaNotes: ['jasmine'],
          availableWeight: 1000,
          reservedWeight: 100,
          isFeatured: true,
        },
      });
      coffeeBeanId = coffeeBean.id;

      const graph = await prisma.coffeeBean.findUnique({
        where: { id: coffeeBean.id },
        include: {
          region: true,
          farmer: true,
          farm: true,
          species: true,
          variety: true,
          processingMethod: true,
          grade: true,
          harvestSeason: true,
        },
      });

      expect(graph?.region.id).toBe(region.id);
      expect(graph?.farmer?.id).toBe(farmer.id);
      expect(graph?.farm?.id).toBe(farm.id);
      expect(graph?.species.id).toBe(species.id);
      expect(graph?.variety?.id).toBe(variety.id);
      expect(graph?.processingMethod.id).toBe(processingMethod.id);
      expect(graph?.grade?.id).toBe(grade.id);
      expect(graph?.harvestSeason?.id).toBe(harvestSeason.id);
      expect(graph?.weightUnit).toBe('kg');
      expect(graph?.isFeatured).toBe(true);
      expect(graph?.isActive).toBe(true);
      expect(graph?.sortOrder).toBe(0);
    } finally {
      if (coffeeBeanId !== undefined) {
        await prisma.coffeeBean.delete({ where: { id: coffeeBeanId } });
      }
      if (farmId !== undefined) {
        await prisma.farm.delete({ where: { id: farmId } });
      }
      if (farmerId !== undefined) {
        await prisma.farmer.delete({ where: { id: farmerId } });
      }
      if (varietyId !== undefined) {
        await prisma.variety.delete({ where: { id: varietyId } });
      }
      if (speciesId !== undefined) {
        await prisma.species.delete({ where: { id: speciesId } });
      }
      if (processingMethodId !== undefined) {
        await prisma.processingMethod.delete({ where: { id: processingMethodId } });
      }
      if (gradeId !== undefined) {
        await prisma.coffeeGrade.delete({ where: { id: gradeId } });
      }
      if (harvestSeasonId !== undefined) {
        await prisma.harvestSeason.delete({ where: { id: harvestSeasonId } });
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
