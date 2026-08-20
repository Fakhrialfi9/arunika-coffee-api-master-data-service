import { describe, expect, it, vi } from 'vitest';

import { RepositoryForeignKeyError } from '../errors/repository.error.js';
import { PrismaTransactionService } from '../prisma-transaction.service.js';
import { PrismaService } from '../prisma.service.js';
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

const createDelegate = () => ({
  findUnique: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
  findMany: vi.fn().mockResolvedValue([]),
  count: vi.fn().mockResolvedValue(0),
  create: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
  update: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
  delete: vi.fn().mockResolvedValue({ uuid: 'uuid-1' }),
});

const createRepositories = (
  prisma: PrismaService,
  transactions: PrismaTransactionService,
) => [
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
    const repositories = createRepositories(prisma, transactions);

    for (const repository of repositories) {
      await expect(repository.findByUuid('uuid-1')).resolves.toEqual({
        uuid: 'uuid-1',
      });
    }

    expect(delegate.findUnique).toHaveBeenCalledTimes(repositories.length);
  });

  it('executes create, update, and delete through the transaction boundary', async () => {
    const delegate = createDelegate();
    const prisma = new Proxy(
      {},
      { get: () => delegate },
    ) as unknown as PrismaService;
    const transactions = {
      run: vi.fn(
        async (operation: (transaction: unknown) => Promise<unknown>) =>
          operation(new Proxy({}, { get: () => delegate })),
      ),
    } as unknown as PrismaTransactionService;
    const repositories = createRepositories(prisma, transactions);

    for (const repository of repositories) {
      await repository.create({} as never);
      await repository.update({ id: 'entity-1' }, {} as never);
      await repository.delete({ id: 'entity-1' });
    }

    expect(transactions.run).toHaveBeenCalledTimes(repositories.length * 3);
    expect(delegate.create).toHaveBeenCalledTimes(repositories.length);
    expect(delegate.update).toHaveBeenCalledTimes(repositories.length);
    expect(delegate.delete).toHaveBeenCalledTimes(repositories.length);
  });

  it('preserves Prisma JSON input without transforming persisted JSON values', async () => {
    const delegate = createDelegate();
    const prisma = new Proxy(
      {},
      { get: () => delegate },
    ) as unknown as PrismaService;
    const transactions = {
      run: vi.fn(
        async (operation: (transaction: unknown) => Promise<unknown>) =>
          operation(new Proxy({}, { get: () => delegate })),
      ),
    } as unknown as PrismaTransactionService;
    const repository = new PrismaCoffeeBeanRepository(prisma, transactions);
    const data = {
      flavorProfiles: ['chocolate', 'caramel'],
      aromaNotes: { primary: ['cocoa'], secondary: ['almond'] },
    };

    await repository.create(data as never);

    expect(delegate.create).toHaveBeenCalledWith({ data });
  });

  it('maps Prisma foreign-key violations to RepositoryForeignKeyError', async () => {
    const delegate = createDelegate();
    delegate.create.mockRejectedValue({
      code: 'P2003',
      meta: { field_name: 'CoffeeBean_regionId_fkey' },
    });
    const prisma = new Proxy(
      {},
      { get: () => delegate },
    ) as unknown as PrismaService;
    const transactions = {
      run: vi.fn(
        async (operation: (transaction: unknown) => Promise<unknown>) =>
          operation(new Proxy({}, { get: () => delegate })),
      ),
    } as unknown as PrismaTransactionService;
    const repository = new PrismaCoffeeBeanRepository(prisma, transactions);

    await expect(repository.create({} as never)).rejects.toBeInstanceOf(
      RepositoryForeignKeyError,
    );
    await expect(repository.create({} as never)).rejects.toMatchObject({
      code: 'REPOSITORY_FOREIGN_KEY_VIOLATION',
      fields: ['CoffeeBean_regionId_fkey'],
    });
  });
});
