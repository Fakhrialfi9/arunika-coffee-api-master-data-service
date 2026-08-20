import { describe, expect, it, vi } from 'vitest';

import { PrismaCertificationRepository } from './prisma-certification.repository.js';
import { PrismaCoffeeBeanRepository } from './prisma-coffee-bean.repository.js';
import { PrismaCoffeeGradeRepository } from './prisma-coffee-grade.repository.js';
import { PrismaCountryRepository } from './prisma-country.repository.js';
import { PrismaFarmRepository } from './prisma-farm.repository.js';
import { PrismaFarmerRepository } from './prisma-farmer.repository.js';
import { PrismaFlavorProfileRepository } from './prisma-flavor-profile.repository.js';
import { PrismaHarvestSeasonRepository } from './prisma-harvest-season.repository.js';
import { PrismaOrganizationRepository } from './prisma-organization.repository.js';
import { PrismaProcessingMethodRepository } from './prisma-processing-method.repository.js';
import { PrismaRegionRepository } from './prisma-region.repository.js';
import { PrismaSensoryProfileFlavorRepository } from './prisma-sensory-profile-flavor.repository.js';
import { PrismaSensoryProfileRepository } from './prisma-sensory-profile.repository.js';
import { PrismaSpeciesRepository } from './prisma-species.repository.js';
import { PrismaVarietyRepository } from './prisma-variety.repository.js';
import { PrismaTransactionService } from '../prisma-transaction.service.js';
import { PrismaService } from '../prisma.service.js';

const createDelegate = () => ({
  findUnique: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
  findMany: vi.fn().mockResolvedValue([]),
  count: vi.fn().mockResolvedValue(0),
  create: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
  update: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
  delete: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
});

describe('Prisma master data repositories', () => {
  it('routes UUID reads through every master data repository', async () => {
    const delegate = createDelegate();
    const prisma = new Proxy(
      {},
      { get: () => delegate },
    ) as unknown as PrismaService;
    const transactions = {
      run: vi.fn(),
    } as unknown as PrismaTransactionService;

    const repositories = [
      new PrismaCertificationRepository(prisma, transactions),
      new PrismaCoffeeBeanRepository(prisma, transactions),
      new PrismaCoffeeGradeRepository(prisma, transactions),
      new PrismaCountryRepository(prisma, transactions),
      new PrismaFarmRepository(prisma, transactions),
      new PrismaFarmerRepository(prisma, transactions),
      new PrismaFlavorProfileRepository(prisma, transactions),
      new PrismaHarvestSeasonRepository(prisma, transactions),
      new PrismaOrganizationRepository(prisma, transactions),
      new PrismaProcessingMethodRepository(prisma, transactions),
      new PrismaRegionRepository(prisma, transactions),
      new PrismaSensoryProfileFlavorRepository(prisma, transactions),
      new PrismaSensoryProfileRepository(prisma, transactions),
      new PrismaSpeciesRepository(prisma, transactions),
      new PrismaVarietyRepository(prisma, transactions),
    ];

    for (const repository of repositories) {
      await expect(repository.findByUuid('uuid-1')).resolves.toEqual({
        uuid: 'uuid-1',
      });
    }

    expect(delegate.findUnique).toHaveBeenCalledTimes(repositories.length);
  });

  it('executes writes through the transaction boundary', async () => {
    const delegate = createDelegate();
    const prisma = new Proxy(
      {},
      { get: () => delegate },
    ) as unknown as PrismaService;
    const transactions = {
      run: vi.fn(async (operation: (transaction: unknown) => Promise<unknown>) =>
        operation({ country: delegate }),
      ),
    } as unknown as PrismaTransactionService;
    const repository = new PrismaCountryRepository(prisma, transactions);

    await repository.create({} as never);
    await repository.update({ id: 'country-1' }, {} as never);
    await repository.delete({ id: 'country-1' });

    expect(transactions.run).toHaveBeenCalledTimes(3);
    expect(delegate.create).toHaveBeenCalledTimes(1);
    expect(delegate.update).toHaveBeenCalledTimes(1);
    expect(delegate.delete).toHaveBeenCalledTimes(1);
  });
});
