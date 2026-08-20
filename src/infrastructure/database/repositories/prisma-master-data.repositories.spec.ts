import { describe, expect, it, vi } from 'vitest';

import {
  RepositoryForeignKeyError,
  RepositoryNotFoundError,
  RepositoryPersistenceError,
  RepositoryUniqueConstraintError,
} from '../errors/repository.error.js';
import type { PrismaTransactionService } from '../prisma-transaction.service.js';
import type { PrismaService } from '../prisma.service.js';
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

type RepositoryContract = {
  findByUuid: (uuid: string) => Promise<unknown>;
  create: (data: never) => Promise<unknown>;
  update: (where: never, data: never) => Promise<unknown>;
  delete: (where: never) => Promise<unknown>;
};

const createRepositories = (
  prisma: PrismaService,
  transactions: PrismaTransactionService,
): RepositoryContract[] => [
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

type PrismaError = Error & {
  code: string;
  meta?: unknown;
};

const createPrismaError = (code: string, meta?: unknown): PrismaError => {
  const error = new Error(`Prisma error ${code}`) as PrismaError;
  error.code = code;
  if (meta !== undefined) error.meta = meta;
  return error;
};

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
    const run = vi.fn(
      async (operation: (transaction: unknown) => Promise<unknown>) =>
        operation(new Proxy({}, { get: () => delegate })),
    );
    const transactions = {
      run,
    } as unknown as PrismaTransactionService;
    const repositories = createRepositories(prisma, transactions);

    for (const repository of repositories) {
      await repository.create({} as never);
      await repository.update({ id: 'entity-1' } as never, {} as never);
      await repository.delete({ id: 'entity-1' } as never);
    }

    expect(run).toHaveBeenCalledTimes(repositories.length * 3);
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

  it('maps Prisma unique violations to RepositoryUniqueConstraintError', async () => {
    const delegate = createDelegate();
    delegate.create.mockRejectedValue(
      createPrismaError('P2002', { target: ['code'] }),
    );
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
    const repository = new PrismaCountryRepository(prisma, transactions);

    await expect(repository.create({} as never)).rejects.toMatchObject({
      code: 'REPOSITORY_UNIQUE_CONSTRAINT',
      fields: ['code'],
    });
    await expect(repository.create({} as never)).rejects.toBeInstanceOf(
      RepositoryUniqueConstraintError,
    );
  });

  it('maps Prisma foreign-key violations to RepositoryForeignKeyError', async () => {
    const delegate = createDelegate();
    delegate.create.mockRejectedValue(
      createPrismaError('P2003', {
        field_name: 'CoffeeBean_regionId_fkey',
      }),
    );
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

    await expect(repository.create({} as never)).rejects.toMatchObject({
      code: 'REPOSITORY_FOREIGN_KEY_VIOLATION',
      fields: ['CoffeeBean_regionId_fkey'],
    });
    await expect(repository.create({} as never)).rejects.toBeInstanceOf(
      RepositoryForeignKeyError,
    );
  });

  it('maps Prisma not-found violations to RepositoryNotFoundError', async () => {
    const delegate = createDelegate();
    delegate.update.mockRejectedValue(createPrismaError('P2025'));
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
    const repository = new PrismaCountryRepository(prisma, transactions);

    await expect(
      repository.update({ id: 'missing' }, {}),
    ).rejects.toBeInstanceOf(RepositoryNotFoundError);
  });

  it('maps unexpected persistence failures to RepositoryPersistenceError', async () => {
    const delegate = createDelegate();
    delegate.delete.mockRejectedValue(new Error('database connection failed'));
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
    const repository = new PrismaCountryRepository(prisma, transactions);

    await expect(repository.delete({ id: 'entity-1' })).rejects.toBeInstanceOf(
      RepositoryPersistenceError,
    );
  });
});
