import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

describe('Step 35 certification master data', () => {
  it('verifies certification schema, attributes, expiration semantics, and uniqueness', async () => {
    const prisma = new PrismaService();
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    const certificationUuid = randomUUID();
    const certificationCode = `CERT-${suffix}`;
    const certificationName = `Step 35 Certification ${suffix}`;

    const certificationIds: string[] = [];

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
          AND TABLE_NAME = 'certifications'
        ORDER BY ORDINAL_POSITION
      `;

      expect(columns.map(({ columnName }) => columnName)).toEqual([
        'id',
        'uuid',
        'code',
        'name',
        'type',
        'issuer',
        'website',
        'countryScope',
        'requiresExpiration',
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
        columns.find(({ columnName }) => columnName === 'requiresExpiration')
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

      const uniqueIndexes = await prisma.$queryRaw<
        Array<{ indexName: string; columnName: string }>
      >`
        SELECT
          INDEX_NAME AS indexName,
          COLUMN_NAME AS columnName
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'certifications'
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

      const expiringCertification = await prisma.certifications.create({
        data: {
          uuid: certificationUuid,
          code: certificationCode,
          name: certificationName,
          type: 'Organic',
          issuer: 'Step 35 Test Issuer',
          website: 'https://example.test/certification',
          countryScope: 'EU',
          requiresExpiration: true,
          description: 'Step 35 certification requiring expiration',
        },
      });
      certificationIds.push(expiringCertification.id);

      expect(expiringCertification.uuid).toBe(certificationUuid);
      expect(expiringCertification.code).toBe(certificationCode);
      expect(expiringCertification.name).toBe(certificationName);
      expect(expiringCertification.type).toBe('Organic');
      expect(expiringCertification.issuer).toBe('Step 35 Test Issuer');
      expect(expiringCertification.website).toBe(
        'https://example.test/certification',
      );
      expect(expiringCertification.countryScope).toBe('EU');
      expect(expiringCertification.requiresExpiration).toBe(true);
      expect(expiringCertification.isActive).toBe(true);
      expect(expiringCertification.sortOrder).toBe(0);

      const nonExpiringCertification = await prisma.certifications.create({
        data: {
          uuid: randomUUID(),
          code: `CERT-NO-EXP-${suffix}`,
          name: `Step 35 Non Expiring ${suffix}`,
          requiresExpiration: false,
        },
      });
      certificationIds.push(nonExpiringCertification.id);

      expect(nonExpiringCertification.requiresExpiration).toBe(false);

      await expect(
        prisma.certifications.create({
          data: {
            uuid: randomUUID(),
            code: certificationCode,
            name: 'Duplicate Certification Code',
          },
        }),
      ).rejects.toMatchObject({ code: 'P2002' });
    } finally {
      for (const id of certificationIds) {
        await prisma.certifications.delete({ where: { id } });
      }

      await prisma.onApplicationShutdown();
    }
  }, 30_000);
});
