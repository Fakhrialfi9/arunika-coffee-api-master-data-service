import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module.js';
import { MasterDataCrudUseCase } from '../../src/application/master-data/use-cases/master-data-crud.use-case.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { seedMasterData } from '../../prisma/seeds/index.js';

async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.sensoryProfileFlavor.deleteMany(),
    prisma.sensoryProfile.deleteMany(),
    prisma.coffeeBean.deleteMany(),
    prisma.farm.deleteMany(),
    prisma.farmer.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.region.deleteMany(),
    prisma.country.deleteMany(),
    prisma.variety.deleteMany(),
    prisma.species.deleteMany(),
    prisma.processingMethod.deleteMany(),
    prisma.coffeeGrade.deleteMany(),
    prisma.harvestSeason.deleteMany(),
    prisma.flavorProfile.deleteMany(),
    prisma.certification.deleteMany(),
  ]);
}

describe('Step 79 Master Data E2E lifecycle', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let useCase: MasterDataCrudUseCase;

  beforeAll(async () => {
    expect(process.env.DATABASE_URL ?? '').toContain(
      'arunika_coffee_master_data_test',
    );
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    useCase = moduleRef.get(MasterDataCrudUseCase);
    await resetDatabase(prisma);
  }, 60_000);

  afterAll(async () => {
    if (prisma) await resetDatabase(prisma);
    if (moduleRef) await moduleRef.close();
  });

  it('creates and reads the complete master-data graph through the application boundary', async () => {
    const country = await useCase.create('country', {
      uuid: '00000000-0000-4000-8000-000000009910',
      code: 'E2E',
      name: 'E2E Country',
      iso2: 'E2',
      iso3: 'E2E',
    });
    const region = await useCase.create('region', {
      uuid: '00000000-0000-4000-8000-000000009911',
      countryId: country.id,
      code: 'E2E-REG',
      name: 'E2E Region',
    });
    const organization = await useCase.create('organization', {
      uuid: '00000000-0000-4000-8000-000000009912',
      regionId: region.id,
      code: 'E2E-ORG',
      name: 'E2E Organization',
      type: 'cooperative',
    });
    const farmer = await useCase.create('farmer', {
      uuid: '00000000-0000-4000-8000-000000009913',
      regionId: region.id,
      organizationId: organization.id,
      code: 'E2E-FAR',
      name: 'E2E Farmer',
      type: 'individual',
    });
    const farm = await useCase.create('farm', {
      uuid: '00000000-0000-4000-8000-000000009914',
      farmerId: farmer.id,
      name: 'E2E Farm',
      area: 2.5,
      altitudeMin: 1100,
      altitudeMax: 1300,
    });

    const species = await useCase.create('species', {
      uuid: '00000000-0000-4000-8000-000000009915',
      code: 'E2E-SP',
      name: 'E2E Species',
    });
    const variety = await useCase.create('variety', {
      uuid: '00000000-0000-4000-8000-000000009916',
      speciesId: species.id,
      code: 'E2E-VAR',
      name: 'E2E Variety',
      plantCharacteristics: { height: 'medium' },
      flavorCharacteristics: ['cocoa'],
    });
    const processing = await useCase.create('processingMethod', {
      uuid: '00000000-0000-4000-8000-000000009917',
      code: 'E2E-PROC',
      name: 'E2E Processing',
      processingSteps: ['sorting', 'drying'],
      parameters: { temperature: 25 },
    });
    const grade = await useCase.create('coffeeGrade', {
      uuid: '00000000-0000-4000-8000-000000009918',
      code: 'E2E-GRADE',
      name: 'E2E Grade',
    });
    const season = await useCase.create('harvestSeason', {
      uuid: '00000000-0000-4000-8000-000000009919',
      name: 'E2E Harvest',
      year: 2026,
      startMonth: 5,
      endMonth: 8,
    });

    const bean = await useCase.create('coffeeBean', {
      uuid: '00000000-0000-4000-8000-000000009920',
      code: 'E2E-BEAN',
      name: 'E2E Bean',
      regionId: region.id,
      farmerId: farmer.id,
      farmId: farm.id,
      speciesId: species.id,
      varietyId: variety.id,
      processingMethodId: processing.id,
      gradeId: grade.id,
      harvestSeasonId: season.id,
      flavorProfiles: ['cocoa', 'caramel'],
      aromaNotes: ['almond'],
      availableWeight: 50,
      reservedWeight: 5,
    });

    const sensory = await useCase.create('sensoryProfile', {
      uuid: '00000000-0000-4000-8000-000000009921',
      coffeeBeanId: bean.id,
      cuppingScore: 85,
      aroma: 'cocoa',
      body: 'medium',
      acidity: 'bright',
      sweetness: 'high',
      aftertaste: 'long',
    });
    const flavor = await useCase.create('flavorProfile', {
      uuid: '00000000-0000-4000-8000-000000009922',
      code: 'E2E-FLAVOR',
      name: 'Cocoa',
      category: 'sweet',
    });
    const sensoryFlavor = await useCase.create('sensoryProfileFlavor', {
      uuid: '00000000-0000-4000-8000-000000009923',
      sensoryProfileId: sensory.id,
      flavorProfileId: flavor.id,
      sortOrder: 1,
    });

    const graph = await useCase.get('coffeeBean', { uuid: bean.uuid });
    expect(graph).toMatchObject({
      id: bean.id,
      regionId: region.id,
      farmerId: farmer.id,
      farmId: farm.id,
      speciesId: species.id,
      varietyId: variety.id,
      processingMethodId: processing.id,
      gradeId: grade.id,
      harvestSeasonId: season.id,
      flavorProfiles: ['cocoa', 'caramel'],
    });
    expect(sensoryFlavor.sensoryProfileId).toBe(sensory.id);
    expect(sensoryFlavor.flavorProfileId).toBe(flavor.id);
  });

  it('rejects invalid relational graphs at the application boundary', async () => {
    const country = await useCase.create('country', {
      uuid: '00000000-0000-4000-8000-000000009930',
      code: 'E2E2',
      name: 'E2E Country 2',
      iso2: 'E3',
      iso3: 'E32',
    });
    const region = await useCase.create('region', {
      uuid: '00000000-0000-4000-8000-000000009931',
      countryId: country.id,
      code: 'E2E-REG-2',
      name: 'E2E Region 2',
    });

    await expect(
      useCase.create('region', {
        uuid: '00000000-0000-4000-8000-000000009932',
        countryId: 'missing-country',
        code: 'BAD-REG',
        name: 'Bad Region',
      }),
    ).rejects.toThrow('region.countryId references a missing country');

    const speciesA = await useCase.create('species', {
      uuid: '00000000-0000-4000-8000-000000009933',
      code: 'E2E-SP-A',
      name: 'Species A',
    });
    const speciesB = await useCase.create('species', {
      uuid: '00000000-0000-4000-8000-000000009934',
      code: 'E2E-SP-B',
      name: 'Species B',
    });
    const varietyB = await useCase.create('variety', {
      uuid: '00000000-0000-4000-8000-000000009935',
      speciesId: speciesB.id,
      code: 'E2E-VAR-B',
      name: 'Variety B',
    });
    const processing = await useCase.create('processingMethod', {
      uuid: '00000000-0000-4000-8000-000000009936',
      code: 'E2E-PROC-B',
      name: 'Processing B',
    });

    await expect(
      useCase.create('coffeeBean', {
        uuid: '00000000-0000-4000-8000-000000009937',
        code: 'E2E-BAD-BEAN',
        name: 'Bad Bean',
        regionId: region.id,
        speciesId: speciesA.id,
        varietyId: varietyB.id,
        processingMethodId: processing.id,
      }),
    ).rejects.toThrow(
      'CoffeeBean varietyId must belong to the selected speciesId',
    );
  });

  it('supports update, inactive state, and deterministic cleanup', async () => {
    const created = await useCase.create('flavorProfile', {
      uuid: '00000000-0000-4000-8000-000000009940',
      code: 'E2E-LIFE',
      name: 'Lifecycle Flavor',
      isActive: true,
    });
    const updated = await useCase.update(
      'flavorProfile',
      { uuid: created.uuid },
      { name: 'Lifecycle Flavor Updated', isActive: false },
    );
    expect(updated.name).toBe('Lifecycle Flavor Updated');
    expect(updated.isActive).toBe(false);

    const inactive = await useCase.get('flavorProfile', { uuid: created.uuid });
    expect(inactive.isActive).toBe(false);

    await useCase.delete('flavorProfile', { uuid: created.uuid });
    await expect(
      useCase.get('flavorProfile', { uuid: created.uuid }),
    ).rejects.toThrow('flavorProfile was not found');
  });

  it('verifies the database is empty after explicit cleanup', async () => {
    await resetDatabase(prisma);
    expect(await prisma.country.count()).toBe(0);
    expect(await prisma.coffeeBean.count()).toBe(0);
    expect(await prisma.sensoryProfile.count()).toBe(0);
    await seedMasterData(prisma);
    expect(await prisma.country.count()).toBeGreaterThan(0);
  });
});
