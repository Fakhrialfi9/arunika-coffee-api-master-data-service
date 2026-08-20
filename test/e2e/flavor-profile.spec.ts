import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 36 flavor master data', () => {
  it('verifies flavor profile schema, categories, uniqueness, and active/sort semantics', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const flavorUuid = randomUUID();
    const flavorCode = `FLAVOR-${suffix}`;
    const flavorName = `Step 36 Flavor ${suffix}`;
    const flavorIds: string[] = [];

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
          AND TABLE_NAME = 'flavor_profiles'
        ORDER BY ORDINAL_POSITION
      `;

      expect(columns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'code',
        'name',
        'category',
        'description',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      expect(
        columns.find(({ columnName }) => columnName === 'uuid')?.isNullable,
      ).toBe('NO');
      expect(
        columns.find(({ columnName }) => columnName === 'code')?.isNullable,
      ).toBe('NO');
      expect(
        columns.find(({ columnName }) => columnName === 'name')?.isNullable,
      ).toBe('NO');
      expect(
        columns.find(({ columnName }) => columnName === 'category')?.isNullable,
      ).toBe('YES');
      expect(
        columns.find(({ columnName }) => columnName === 'description')
          ?.isNullable,
      ).toBe('YES');
      expect(
        columns.find(({ columnName }) => columnName === 'isActive')
          ?.columnDefault,
      ).toBe('1');
      expect(
        columns.find(({ columnName }) => columnName === 'sortOrder')
          ?.columnDefault,
      ).toBe('0');

      const uniqueIndexes = await prisma.$queryRaw<
        Array<{ indexName: string; columnName: string }>
      >`
        SELECT
          INDEX_NAME AS indexName,
          COLUMN_NAME AS columnName
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'flavor_profiles'
          AND NON_UNIQUE = 0
          AND COLUMN_NAME IN ('uuid', 'code')
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      expect(uniqueIndexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ columnName: 'uuid' }),
          expect.objectContaining({ columnName: 'code' }),
        ]),
      );

      const activeFlavor = await prisma.flavorProfiles.create({
        data: {
          uuid: flavorUuid,
          code: flavorCode,
          name: flavorName,
          category: 'Fruity',
          description: 'Step 36 active flavor profile',
          isActive: true,
          sortOrder: 7,
        },
      });
      flavorIds.push(activeFlavor.id);

      expect(activeFlavor.uuid).toBe(flavorUuid);
      expect(activeFlavor.code).toBe(flavorCode);
      expect(activeFlavor.name).toBe(flavorName);
      expect(activeFlavor.category).toBe('Fruity');
      expect(activeFlavor.description).toBe('Step 36 active flavor profile');
      expect(activeFlavor.isActive).toBe(true);
      expect(activeFlavor.sortOrder).toBe(7);

      const inactiveFlavor = await prisma.flavorProfiles.create({
        data: {
          uuid: randomUUID(),
          code: `FLAVOR-INACTIVE-${suffix}`,
          name: `Step 36 Inactive Flavor ${suffix}`,
          category: 'Sweet',
          isActive: false,
          sortOrder: 9,
        },
      });
      flavorIds.push(inactiveFlavor.id);

      expect(inactiveFlavor.isActive).toBe(false);
      expect(inactiveFlavor.sortOrder).toBe(9);

      const uncategorizedFlavor = await prisma.flavorProfiles.create({
        data: {
          uuid: randomUUID(),
          code: `FLAVOR-UNCATEGORIZED-${suffix}`,
          name: `Step 36 Uncategorized Flavor ${suffix}`,
        },
      });
      flavorIds.push(uncategorizedFlavor.id);

      expect(uncategorizedFlavor.category).toBeNull();
      expect(uncategorizedFlavor.isActive).toBe(true);
      expect(uncategorizedFlavor.sortOrder).toBe(0);

      await expect(
        prisma.flavorProfiles.create({
          data: {
            uuid: randomUUID(),
            code: flavorCode,
            name: 'Duplicate Flavor Code',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      for (const id of flavorIds) {
        await prisma.flavorProfiles.delete({ where: { id } });
      }

      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
