import { describe, expect, it, vi } from 'vitest';

import { RepositoryBusinessRuleError } from '../errors/repository.error.js';
import type { PrismaTransactionService } from '../prisma-transaction.service.js';
import type { PrismaService } from '../prisma.service.js';
import { PrismaHarvestSeasonRepository } from './prisma-harvest-season.repository.js';

const createRepository = () => {
  const delegate = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'created' }),
    update: vi.fn().mockResolvedValue({ id: 'updated' }),
  };

  const prisma = {
    harvestSeason: delegate,
  } as unknown as PrismaService;

  const run = vi.fn(
    async (operation: (transaction: unknown) => Promise<unknown>) =>
      operation({ harvestSeason: delegate }),
  );

  const transactions = { run } as unknown as PrismaTransactionService;

  return {
    repository: new PrismaHarvestSeasonRepository(prisma, transactions),
    delegate,
    run,
  };
};

describe('PrismaHarvestSeasonRepository current-season integrity', () => {
  it('rejects creating a second current season', async () => {
    const { repository, delegate } = createRepository();
    delegate.findFirst.mockResolvedValue({ id: 'existing-current' });

    await expect(
      repository.create({
        name: '2026 Main Harvest',
        year: 2026,
        isCurrent: true,
      } as never),
    ).rejects.toBeInstanceOf(RepositoryBusinessRuleError);

    expect(delegate.create).not.toHaveBeenCalled();
  });

  it('rejects an inactive current season at the persistence boundary', async () => {
    const { repository, delegate } = createRepository();
    delegate.findFirst.mockResolvedValue(null);

    await expect(
      repository.create({
        name: '2026 Main Harvest',
        year: 2026,
        isCurrent: true,
        isActive: false,
      } as never),
    ).rejects.toMatchObject({
      code: 'REPOSITORY_BUSINESS_RULE_VIOLATION',
      rule: 'HARVEST_SEASON_CURRENT_MUST_BE_ACTIVE',
    });

    expect(delegate.create).not.toHaveBeenCalled();
  });

  it('allows creating a non-current harvest season without current-season lookup', async () => {
    const { repository, delegate } = createRepository();

    await expect(
      repository.create({
        name: '2026 Secondary Harvest',
        year: 2026,
        isCurrent: false,
      } as never),
    ).resolves.toEqual({ id: 'created' });

    expect(delegate.findFirst).not.toHaveBeenCalled();
    expect(delegate.create).toHaveBeenCalledTimes(1);
  });

  it('rejects updating an existing season into a second current season', async () => {
    const { repository, delegate } = createRepository();
    delegate.findUnique.mockResolvedValue({
      id: 'target',
      isCurrent: false,
      isActive: true,
    });
    delegate.findFirst.mockResolvedValue({ id: 'existing-current' });

    await expect(
      repository.update(
        { id: 'target' },
        { isCurrent: true },
      ),
    ).rejects.toMatchObject({
      code: 'REPOSITORY_BUSINESS_RULE_VIOLATION',
      rule: 'HARVEST_SEASON_SINGLE_CURRENT',
    });

    expect(delegate.update).not.toHaveBeenCalled();
  });

  it('rejects updating a current season to inactive', async () => {
    const { repository, delegate } = createRepository();
    delegate.findUnique.mockResolvedValue({
      id: 'target',
      isCurrent: true,
      isActive: true,
    });

    await expect(
      repository.update({ id: 'target' }, { isActive: false }),
    ).rejects.toMatchObject({
      code: 'REPOSITORY_BUSINESS_RULE_VIOLATION',
      rule: 'HARVEST_SEASON_CURRENT_MUST_BE_ACTIVE',
    });

    expect(delegate.update).not.toHaveBeenCalled();
  });
});
