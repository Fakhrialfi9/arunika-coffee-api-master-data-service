import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module.js';
import { MasterDataCrudUseCase } from '../../src/application/master-data/use-cases/master-data-crud.use-case.js';
import type {
  MasterDataEntityName,
  MasterDataRepositoryFactory,
} from '../../src/domain/shared/repositories/master-data.repository.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { PrismaMasterDataRepositoryFactory } from '../../src/infrastructure/database/repositories/prisma-master-data-repository.factory.js';
import { seedMasterData } from '../../prisma/seeds/index.js';

const ENTITIES: MasterDataEntityName[] = [
  'certification',
  'coffeeBean',
  'coffeeGrade',
  'country',
  'farm',
  'farmer',
  'flavorProfile',
  'harvestSeason',
  'organization',
  'processingMethod',
  'region',
  'sensoryProfile',
  'sensoryProfileFlavor',
  'species',
  'variety',
];

async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM sensory_profile_flavors`,
    prisma.$executeRaw`DELETE FROM sensory_profiles`,
    prisma.$executeRaw`DELETE FROM coffee_beans`,
    prisma.$executeRaw`DELETE FROM farms`,
    prisma.$executeRaw`DELETE FROM farmers`,
    prisma.$executeRaw`DELETE FROM organizations`,
    prisma.$executeRaw`DELETE FROM regions`,
    prisma.$executeRaw`DELETE FROM countries`,
    prisma.$executeRaw`DELETE FROM varieties`,
    prisma.$executeRaw`DELETE FROM species`,
    prisma.$executeRaw`DELETE FROM processing_methods`,
    prisma.$executeRaw`DELETE FROM coffee_grades`,
    prisma.$executeRaw`DELETE FROM harvest_seasons`,
    prisma.$executeRaw`DELETE FROM flavor_profiles`,
    prisma.$executeRaw`DELETE FROM certifications`,
  ]);
}

describe('Step 77/78 real MySQL repository and database integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let factory: MasterDataRepositoryFactory;
  let useCase: MasterDataCrudUseCase;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    expect(databaseUrl).toContain('arunika_coffee_master_data_test');

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    factory = moduleRef.get(PrismaMasterDataRepositoryFactory);
    useCase = moduleRef.get(MasterDataCrudUseCase);

    await resetDatabase(prisma);
    await seedMasterData(prisma);
  }, 60_000);

  afterAll(async () => {
    if (prisma) await resetDatabase(prisma);
    if (moduleRef) await moduleRef.close();
  });

  it('connects to the dedicated MySQL test database', async () => {
    const rows = await prisma.$queryRaw<Array<{ databaseName: string }>>`
      SELECT DATABASE() AS databaseName
    `;
    expect(rows[0]?.databaseName).toBe('arunika_coffee_master_data_test');
  });

  it('has persisted rows accessible through every Prisma repository adapter', async () => {
    for (const entity of ENTITIES) {
      const result = await factory.get(entity).list({ page: 1, limit: 10 });
      expect(result.total, entity).toBeGreaterThan(0);
      expect(result.items[0]?.id, entity).toBeTruthy();
      expect(result.items[0]?.uuid, entity).toBeTruthy();
    }
  });

  it('supports real country CRUD through the repository and application boundary', async () => {
    const created = await useCase.create('country', {
      uuid: '00000000-0000-4000-8000-000000009901',
      code: 'ITG',
      name: 'Integration Country',
      iso2: 'IG',
      iso3: 'ITG',
      isActive: true,
    });

    const fetched = await useCase.get('country', { uuid: created.uuid });
    expect(fetched.name).toBe('Integration Country');

    const updated = await useCase.update(
      'country',
      { uuid: created.uuid },
      { name: 'Integration Country Updated' },
    );
    expect(updated.name).toBe('Integration Country Updated');

    await useCase.delete('country', { uuid: created.uuid });
    await expect(
      useCase.get('country', { uuid: created.uuid }),
    ).rejects.toThrow('country was not found');
  });

  it('enforces unique and foreign-key constraints against real MySQL', async () => {
    const country = await factory
      .get('country')
      .findByUuid('00000000-0000-4000-8000-000000000001');
    expect(country).not.toBeNull();

    await expect(
      factory.get('country').create({
        uuid: '00000000-0000-4000-8000-000000009902',
        code: 'ID',
        name: 'Duplicate Country',
        iso2: 'DI',
        iso3: 'DUP',
      }),
    ).rejects.toMatchObject({ code: 'REPOSITORY_UNIQUE_CONSTRAINT' });

    await expect(
      useCase.create('region', {
        uuid: '00000000-0000-4000-8000-000000009903',
        code: 'BAD-FK',
        name: 'Invalid Region',
        countryId: 'missing-country-id',
      }),
    ).rejects.toThrow('region.countryId references a missing country');
  });

  it('round-trips JSON fields through real MySQL', async () => {
    const coffeeBean = await factory
      .get('coffeeBean')
      .findByUuid('00000000-0000-4000-8000-000000000013');
    expect(coffeeBean).toMatchObject({
      flavorProfiles: ['chocolate'],
      aromaNotes: ['cocoa', 'caramel'],
    });
  });

  it('executes transaction commit and rollback on the real database', async () => {
    const before = await prisma.country.count();
    await prisma.$transaction(async (tx) => {
      await tx.country.create({
        data: {
          uuid: '00000000-0000-4000-8000-000000009904',
          code: 'TXC',
          name: 'Committed Country',
          iso2: 'TC',
          iso3: 'TXC',
        },
      });
    });
    expect(await prisma.country.count()).toBe(before + 1);

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.country.create({
          data: {
            uuid: '00000000-0000-4000-8000-000000009905',
            code: 'TXR',
            name: 'Rolled Back Country',
            iso2: 'TR',
            iso3: 'TXR',
          },
        });
        throw new Error('force rollback');
      }),
    ).rejects.toThrow('force rollback');

    expect(
      await prisma.country.findUnique({ where: { code: 'TXR' } }),
    ).toBeNull();
    await prisma.country.delete({ where: { code: 'TXC' } });
  });
});
