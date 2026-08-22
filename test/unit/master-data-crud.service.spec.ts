import { describe, expect, it, vi } from 'vitest';

import { MasterDataCrudService } from '../../src/application/master-data/services/master-data-crud.service.js';
import { MasterDataValidationError } from '../../src/application/master-data/errors/master-data.errors.js';
import type { MasterDataRepositoryFactory } from '../../src/domain/shared/repositories/master-data.repository.js';

const record = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  uuid: `${id}-uuid`,
  ...extra,
});

function createFactory(overrides: Record<string, unknown> = {}) {
  const repository = {
    findById: vi.fn(),
    findByUuid: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
    }),
    create: vi.fn().mockResolvedValue(record('created')),
    update: vi.fn().mockResolvedValue(record('updated')),
    delete: vi.fn().mockResolvedValue(record('deleted')),
  };

  const factory = {
    get: vi.fn().mockReturnValue(repository),
  } as unknown as MasterDataRepositoryFactory;

  Object.assign(repository, overrides);
  return { factory, repository };
}

describe('MasterDataCrudService critical business behavior', () => {
  it('rejects invalid pagination and unsafe sort/filter fields before repository access', async () => {
    const { factory, repository } = createFactory();
    const service = new MasterDataCrudService(factory);

    await expect(service.list('country', { page: 0 })).rejects.toBeInstanceOf(
      MasterDataValidationError,
    );
    await expect(
      service.list('country', { sortBy: 'DROP TABLE countries' as never }),
    ).rejects.toBeInstanceOf(MasterDataValidationError);
    await expect(
      service.list('country', { filters: { password: 'x' } as never }),
    ).rejects.toBeInstanceOf(MasterDataValidationError);

    expect(repository.list).not.toHaveBeenCalled();
  });

  it('rejects a farmer whose organization belongs to another region', async () => {
    const regionRepository = {
      findById: vi.fn().mockResolvedValue(record('region-1')),
    };
    const organizationRepository = {
      findById: vi.fn().mockResolvedValue(
        record('org-1', { regionId: 'region-2' }),
      ),
    };
    const farmerRepository = { create: vi.fn() };
    const factory = {
      get: vi.fn((entity) => {
        if (entity === 'region') return regionRepository;
        if (entity === 'organization') return organizationRepository;
        if (entity === 'farmer') return farmerRepository;
        throw new Error(`Unexpected entity: ${entity}`);
      }),
    } as unknown as MasterDataRepositoryFactory;
    const service = new MasterDataCrudService(factory);

    await expect(
      service.create('farmer', {
        name: 'Farmer',
        code: 'F-1',
        type: 'individual',
        regionId: 'region-1',
        organizationId: 'org-1',
      }),
    ).rejects.toThrow('Farmer organizationId must belong to regionId');
    expect(farmerRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a coffee bean when variety belongs to another species', async () => {
    const entities = {
      region: { findById: vi.fn().mockResolvedValue(record('region-1')) },
      species: { findById: vi.fn().mockResolvedValue(record('species-1')) },
      processingMethod: {
        findById: vi.fn().mockResolvedValue(record('processing-1')),
      },
      farmer: { findById: vi.fn().mockResolvedValue(null) },
      farm: { findById: vi.fn().mockResolvedValue(null) },
      variety: {
        findById: vi
          .fn()
          .mockResolvedValue(record('variety-1', { speciesId: 'species-2' })),
      },
      coffeeBean: { create: vi.fn() },
      coffeeGrade: { findById: vi.fn().mockResolvedValue(null) },
      harvestSeason: { findById: vi.fn().mockResolvedValue(null) },
    };
    const factory = {
      get: vi.fn((entity) => entities[entity as keyof typeof entities]),
    } as unknown as MasterDataRepositoryFactory;
    const service = new MasterDataCrudService(factory);

    await expect(
      service.create('coffeeBean', {
        name: 'Bean',
        code: 'CB-1',
        regionId: 'region-1',
        speciesId: 'species-1',
        varietyId: 'variety-1',
        processingMethodId: 'processing-1',
      }),
    ).rejects.toThrow(
      'CoffeeBean varietyId must belong to the selected speciesId',
    );
    expect(entities.coffeeBean.create).not.toHaveBeenCalled();
  });

  it('rejects invalid coffee bean numeric values', async () => {
    const entities = {
      region: { findById: vi.fn().mockResolvedValue(record('region-1')) },
      species: { findById: vi.fn().mockResolvedValue(record('species-1')) },
      processingMethod: {
        findById: vi.fn().mockResolvedValue(record('processing-1')),
      },
      farmer: { findById: vi.fn().mockResolvedValue(null) },
      farm: { findById: vi.fn().mockResolvedValue(null) },
      variety: { findById: vi.fn().mockResolvedValue(null) },
      coffeeGrade: { findById: vi.fn().mockResolvedValue(null) },
      harvestSeason: { findById: vi.fn().mockResolvedValue(null) },
      coffeeBean: { create: vi.fn() },
    };
    const factory = {
      get: vi.fn((entity) => entities[entity as keyof typeof entities]),
    } as unknown as MasterDataRepositoryFactory;
    const service = new MasterDataCrudService(factory);

    await expect(
      service.create('coffeeBean', {
        name: 'Bean',
        code: 'CB-2',
        regionId: 'region-1',
        speciesId: 'species-1',
        processingMethodId: 'processing-1',
        moisture: 101,
      }),
    ).rejects.toThrow('moisture must be between 0 and 100');
    expect(entities.coffeeBean.create).not.toHaveBeenCalled();
  });

  it('returns not-found for an empty identifier lookup', async () => {
    const { factory, repository } = createFactory();
    repository.findById.mockResolvedValue(null);
    const service = new MasterDataCrudService(factory);

    await expect(service.get('country', { id: 'missing' })).rejects.toThrow(
      'country was not found',
    );
  });
});
