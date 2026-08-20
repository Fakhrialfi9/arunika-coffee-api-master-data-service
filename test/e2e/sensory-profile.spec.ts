import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

type ColumnMetadata = {
  columnName: string;
  isNullable: string;
  columnDefault: string | null;
};

type ForeignKeyMetadata = {
  columnName: string;
  referencedTableName: string;
  referencedColumnName: string;
  deleteRule: string;
  updateRule: string;
};

describe('Step 38 sensory profile schema', () => {
  it('verifies sensory profile schema, coffee bean relationship, and sensory attributes', async () => {
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
          AND TABLE_NAME = 'sensory_profiles'
        ORDER BY ORDINAL_POSITION
      `;

      expect(columns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'coffeeBeanId',
        'cuppingScore',
        'aroma',
        'body',
        'acidity',
        'sweetness',
        'aftertaste',
        'description',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      expect(
        columns.find(({ columnName }) => columnName === 'coffeeBeanId'),
      ).toEqual({
        columnName: 'coffeeBeanId',
        isNullable: 'NO',
        columnDefault: null,
      });

      for (const columnName of [
        'cuppingScore',
        'aroma',
        'body',
        'acidity',
        'sweetness',
        'aftertaste',
        'description',
      ]) {
        expect(
          columns.find((column) => column.columnName === columnName)
            ?.isNullable,
        ).toBe('YES');
      }

      expect(
        columns.find(({ columnName }) => columnName === 'isActive')
          ?.columnDefault,
      ).toBe('1');
      expect(
        columns.find(({ columnName }) => columnName === 'sortOrder')
          ?.columnDefault,
      ).toBe('0');

      const indexes = await prisma.$queryRaw<
        Array<{ indexName: string; columnName: string }>
      >`
        SELECT
          INDEX_NAME AS indexName,
          COLUMN_NAME AS columnName
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sensory_profiles'
          AND COLUMN_NAME IN ('uuid', 'coffeeBeanId')
      `;

      expect(
        indexes.some(
          ({ indexName, columnName }) =>
            indexName === 'sensory_profiles_uuid_key' && columnName === 'uuid',
        ),
      ).toBe(true);
      expect(
        indexes.some(
          ({ indexName, columnName }) =>
            indexName === 'sensory_profiles_coffeeBeanId_key' &&
            columnName === 'coffeeBeanId',
        ),
      ).toBe(true);

      const foreignKeys = await prisma.$queryRaw<ForeignKeyMetadata[]>`
        SELECT
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
          AND kcu.TABLE_NAME = 'sensory_profiles'
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(foreignKeys).toEqual([
        {
          columnName: 'coffeeBeanId',
          referencedTableName: 'coffee_beans',
          referencedColumnName: 'id',
          deleteRule: 'RESTRICT',
          updateRule: 'CASCADE',
        },
      ]);

      const coffeeBeanRelation = await prisma.$queryRaw<
        Array<{ tableName: string; columnName: string }>
      >`
        SELECT
          TABLE_NAME AS tableName,
          COLUMN_NAME AS columnName
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'sensory_profiles'
          AND COLUMN_NAME = 'coffeeBeanId'
          AND REFERENCED_TABLE_NAME = 'coffee_beans'
          AND REFERENCED_COLUMN_NAME = 'id'
      `;

      expect(coffeeBeanRelation).toEqual([
        { tableName: 'sensory_profiles', columnName: 'coffeeBeanId' },
      ]);
    } finally {
      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
