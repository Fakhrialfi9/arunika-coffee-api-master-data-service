import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

type CoffeeBeanForeignKey = {
  columnName: string;
  referencedTableName: string;
  referencedColumnName: string;
  deleteRule: string;
  updateRule: string;
};

const EXPECTED_FOREIGN_KEYS: CoffeeBeanForeignKey[] = [
  {
    columnName: 'regionId',
    referencedTableName: 'regions',
    referencedColumnName: 'id',
    deleteRule: 'RESTRICT',
    updateRule: 'CASCADE',
  },
  {
    columnName: 'farmerId',
    referencedTableName: 'farmers',
    referencedColumnName: 'id',
    deleteRule: 'SET NULL',
    updateRule: 'CASCADE',
  },
  {
    columnName: 'farmId',
    referencedTableName: 'farms',
    referencedColumnName: 'id',
    deleteRule: 'SET NULL',
    updateRule: 'CASCADE',
  },
  {
    columnName: 'speciesId',
    referencedTableName: 'species',
    referencedColumnName: 'id',
    deleteRule: 'RESTRICT',
    updateRule: 'CASCADE',
  },
  {
    columnName: 'varietyId',
    referencedTableName: 'varieties',
    referencedColumnName: 'id',
    deleteRule: 'SET NULL',
    updateRule: 'CASCADE',
  },
  {
    columnName: 'processingMethodId',
    referencedTableName: 'processing_methods',
    referencedColumnName: 'id',
    deleteRule: 'RESTRICT',
    updateRule: 'CASCADE',
  },
  {
    columnName: 'gradeId',
    referencedTableName: 'coffee_grades',
    referencedColumnName: 'id',
    deleteRule: 'SET NULL',
    updateRule: 'CASCADE',
  },
  {
    columnName: 'harvestSeasonId',
    referencedTableName: 'harvest_seasons',
    referencedColumnName: 'id',
    deleteRule: 'SET NULL',
    updateRule: 'CASCADE',
  },
];

describe('Step 37 coffee bean master schema', () => {
  it('verifies the coffee bean foreign-key relationship graph', async () => {
    const prisma = new PrismaService();

    try {
      await prisma.onModuleInit();

      const foreignKeys = await prisma.$queryRaw<CoffeeBeanForeignKey[]>`
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
          AND kcu.TABLE_NAME = 'coffee_beans'
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY kcu.COLUMN_NAME
      `;

      expect(foreignKeys).toEqual(EXPECTED_FOREIGN_KEYS);
    } finally {
      await prisma.onApplicationShutdown();
    }
  }, 30_000);

  it('verifies required and optional coffee bean relationship fields', async () => {
    const prisma = new PrismaService();

    try {
      await prisma.onModuleInit();

      const columns = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT
          COLUMN_NAME AS columnName,
          IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'coffee_beans'
          AND COLUMN_NAME IN (
            'regionId',
            'farmerId',
            'farmId',
            'speciesId',
            'varietyId',
            'processingMethodId',
            'gradeId',
            'harvestSeasonId'
          )
        ORDER BY COLUMN_NAME
      `;

      expect(columns).toEqual([
        { columnName: 'farmId', isNullable: 'YES' },
        { columnName: 'farmerId', isNullable: 'YES' },
        { columnName: 'gradeId', isNullable: 'YES' },
        { columnName: 'harvestSeasonId', isNullable: 'YES' },
        { columnName: 'processingMethodId', isNullable: 'NO' },
        { columnName: 'regionId', isNullable: 'NO' },
        { columnName: 'speciesId', isNullable: 'NO' },
        { columnName: 'varietyId', isNullable: 'YES' },
      ]);
    } finally {
      await prisma.onApplicationShutdown();
    }
  });
});
