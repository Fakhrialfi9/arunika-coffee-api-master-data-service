import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

type ColumnMetadata = {
  columnName: string;
  isNullable: string;
  columnDefault: string | null;
};

type IndexMetadata = {
  indexName: string;
  columnName: string;
  nonUnique: number;
};

type ForeignKeyMetadata = {
  constraintName: string;
  columnName: string;
  referencedTableName: string;
  referencedColumnName: string;
  deleteRule: string;
  updateRule: string;
};

describe('Step 39 sensory flavor mapping', () => {
  it('verifies the sensory profile to flavor profile many-to-many mapping', async () => {
    const prisma = new PrismaService();

    try {
      await prisma.onModuleInit();

      const columns = await prisma.$queryRaw<ColumnMetadata[]>`
        SELECT
          COLUMN_NAME AS columnName,
          IS_NULLABLE AS isNullable,
          COLUMN_DEFAULT AS columnDefault
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sensory_profile_flavors'
        ORDER BY ORDINAL_POSITION
      `;

      expect(columns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'sensoryProfileId',
        'flavorProfileId',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      for (const columnName of ['sensoryProfileId', 'flavorProfileId']) {
        expect(
          columns.find((column) => column.columnName === columnName)
            ?.isNullable,
        ).toBe('NO');
      }

      expect(
        columns.find(({ columnName }) => columnName === 'sortOrder')
          ?.columnDefault,
      ).toBe('0');

      const indexes = await prisma.$queryRaw<IndexMetadata[]>`
        SELECT
          INDEX_NAME AS indexName,
          COLUMN_NAME AS columnName,
          NON_UNIQUE AS nonUnique
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sensory_profile_flavors'
          AND INDEX_NAME IN (
            'sensory_profile_flavors_uuid_key',
            'sensory_profile_flavors_sensoryProfileId_idx',
            'sensory_profile_flavors_flavorProfileId_idx',
            'sensory_profile_flavors_sensoryProfileId_flavorProfileId_key'
          )
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `;

      expect(indexes).toEqual([
        {
          indexName: 'sensory_profile_flavors_flavorProfileId_idx',
          columnName: 'flavorProfileId',
          nonUnique: 1,
        },
        {
          indexName:
            'sensory_profile_flavors_sensoryProfileId_flavorProfileId_key',
          columnName: 'sensoryProfileId',
          nonUnique: 0,
        },
        {
          indexName:
            'sensory_profile_flavors_sensoryProfileId_flavorProfileId_key',
          columnName: 'flavorProfileId',
          nonUnique: 0,
        },
        {
          indexName: 'sensory_profile_flavors_sensoryProfileId_idx',
          columnName: 'sensoryProfileId',
          nonUnique: 1,
        },
        {
          indexName: 'sensory_profile_flavors_uuid_key',
          columnName: 'uuid',
          nonUnique: 0,
        },
      ]);

      const foreignKeys = await prisma.$queryRaw<ForeignKeyMetadata[]>`
        SELECT
          kcu.CONSTRAINT_NAME AS constraintName,
          kcu.COLUMN_NAME AS columnName,
          kcu.REFERENCED_TABLE_NAME AS referencedTableName,
          kcu.REFERENCED_COLUMN_NAME AS referencedColumnName,
          rc.DELETE_RULE AS deleteRule,
          rc.UPDATE_RULE AS updateRule
        FROM information_schema.KEY_COLUMN_USAGE AS kcu
        INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS AS rc
          ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
          AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
        WHERE kcu.CONSTRAINT_SCHEMA = DATABASE()
          AND kcu.TABLE_NAME = 'sensory_profile_flavors'
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY kcu.CONSTRAINT_NAME
      `;

      expect(foreignKeys).toEqual([
        {
          constraintName: 'sensory_profile_flavors_flavorProfileId_fkey',
          columnName: 'flavorProfileId',
          referencedTableName: 'flavor_profiles',
          referencedColumnName: 'id',
          deleteRule: 'RESTRICT',
          updateRule: 'CASCADE',
        },
        {
          constraintName: 'sensory_profile_flavors_sensoryProfileId_fkey',
          columnName: 'sensoryProfileId',
          referencedTableName: 'sensory_profiles',
          referencedColumnName: 'id',
          deleteRule: 'CASCADE',
          updateRule: 'CASCADE',
        },
      ]);

      const mappingRelationships = await prisma.$queryRaw<
        Array<{
          tableName: string;
          columnName: string;
          referencedTableName: string;
        }>
      >`
        SELECT
          TABLE_NAME AS tableName,
          COLUMN_NAME AS columnName,
          REFERENCED_TABLE_NAME AS referencedTableName
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sensory_profile_flavors'
          AND REFERENCED_TABLE_NAME IN ('sensory_profiles', 'flavor_profiles')
        ORDER BY REFERENCED_TABLE_NAME
      `;

      expect(mappingRelationships).toEqual([
        {
          tableName: 'sensory_profile_flavors',
          columnName: 'flavorProfileId',
          referencedTableName: 'flavor_profiles',
        },
        {
          tableName: 'sensory_profile_flavors',
          columnName: 'sensoryProfileId',
          referencedTableName: 'sensory_profiles',
        },
      ]);
    } finally {
      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
