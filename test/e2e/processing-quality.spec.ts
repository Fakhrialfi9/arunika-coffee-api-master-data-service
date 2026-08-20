import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 33 processing and quality master data', () => {
  it('verifies processing methods, coffee grades, and coffee bean relationships', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const processingCode = `STEP33-P-${suffix}`;
    const gradeCode = `STEP33-G-${suffix}`;

    let processingMethodId: string | undefined;
    let gradeId: string | undefined;

    try {
      await prisma.onModuleInit();

      const processingColumns = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'processing_methods'
        ORDER BY ORDINAL_POSITION
      `;

      expect(processingColumns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'code',
        'name',
        'category',
        'fermentation',
        'fermentationType',
        'fermentationDuration',
        'dryingMethod',
        'dryingDuration',
        'processingSteps',
        'parameters',
        'description',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      const gradeColumns = await prisma.$queryRaw<
        Array<{ columnName: string; isNullable: string }>
      >`
        SELECT COLUMN_NAME AS columnName, IS_NULLABLE AS isNullable
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'coffee_grades'
        ORDER BY ORDINAL_POSITION
      `;

      expect(gradeColumns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'code',
        'name',
        'category',
        'standard',
        'minimumCuppingScore',
        'maxDefectCount',
        'exportEligible',
        'description',
        'isActive',
        'sortOrder',
        'createdAt',
        'updatedAt',
      ]);

      const processingBeanForeignKeys = await prisma.$queryRaw<
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
          AND COLUMN_NAME = 'processingMethodId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(processingBeanForeignKeys).toEqual([
        {
          columnName: 'processingMethodId',
          referencedTable: 'processing_methods',
          referencedColumn: 'id',
        },
      ]);

      const gradeBeanForeignKeys = await prisma.$queryRaw<
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
          AND COLUMN_NAME = 'gradeId'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;

      expect(gradeBeanForeignKeys).toEqual([
        {
          columnName: 'gradeId',
          referencedTable: 'coffee_grades',
          referencedColumn: 'id',
        },
      ]);

      expect(
        processingColumns.find(
          ({ columnName }) => columnName === 'fermentation',
        )?.isNullable,
      ).toBe('NO');
      expect(
        gradeColumns.find(({ columnName }) => columnName === 'exportEligible')
          ?.isNullable,
      ).toBe('NO');

      const processingMethod = await prisma.processingMethod.create({
        data: {
          code: processingCode,
          name: 'Step 33 Washed',
          category: 'Wet Process',
          fermentation: true,
          fermentationType: 'Controlled',
          fermentationDuration: '24 hours',
          dryingMethod: 'Raised beds',
          dryingDuration: '14 days',
          processingSteps: ['sorting', 'fermentation', 'washing', 'drying'],
          parameters: { temperature: 20 },
        },
      });
      processingMethodId = processingMethod.id;

      expect(processingMethod.fermentation).toBe(true);
      expect(processingMethod.isActive).toBe(true);
      expect(processingMethod.sortOrder).toBe(0);

      const grade = await prisma.coffeeGrade.create({
        data: {
          code: gradeCode,
          name: 'Step 33 Grade 80+',
          category: 'Specialty',
          standard: 'SCA',
          minimumCuppingScore: 80,
          maxDefectCount: 5,
          exportEligible: true,
        },
      });
      gradeId = grade.id;

      expect(grade.minimumCuppingScore).toBe(80);
      expect(grade.maxDefectCount).toBe(5);
      expect(grade.exportEligible).toBe(true);
      expect(grade.isActive).toBe(true);
      expect(grade.sortOrder).toBe(0);

      const processingWithBeans = await prisma.processingMethod.findUnique({
        where: { id: processingMethod.id },
        include: { coffeeBeans: true },
      });
      expect(processingWithBeans?.coffeeBeans).toEqual([]);

      const gradeWithBeans = await prisma.coffeeGrade.findUnique({
        where: { id: grade.id },
        include: { coffeeBeans: true },
      });
      expect(gradeWithBeans?.coffeeBeans).toEqual([]);

      await expect(
        prisma.processingMethod.create({
          data: {
            code: processingCode,
            name: 'Duplicate Processing Method',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });

      await expect(
        prisma.coffeeGrade.create({
          data: {
            code: gradeCode,
            name: 'Duplicate Coffee Grade',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      if (gradeId !== undefined) {
        await prisma.coffeeGrade.delete({ where: { id: gradeId } });
      }

      if (processingMethodId !== undefined) {
        await prisma.processingMethod.delete({
          where: { id: processingMethodId },
        });
      }

      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
