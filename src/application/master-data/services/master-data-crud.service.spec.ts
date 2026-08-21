import { describe, expect, it } from 'vitest';
import { MasterDataCrudService } from './master-data-crud.service.js';
import type {
  MasterDataRepository,
  MasterDataRepositoryFactory,
} from '../../../domain/shared/repositories/master-data.repository.js';

function repository(
  seed: Record<string, Record<string, unknown>>,
): MasterDataRepository {
  return {
    findById(id) {
      return Promise.resolve(
        (Object.values(seed).find((row) => row.id === id) as never) ?? null,
      );
    },
    findByUuid(uuid) {
      return Promise.resolve(
        (Object.values(seed).find((row) => row.uuid === uuid) as never) ?? null,
      );
    },
    list() {
      return Promise.resolve({
        items: Object.values(seed) as never,
        page: 1,
        limit: 25,
        total: Object.keys(seed).length,
        totalPages: 1,
      });
    },
    create(data) {
      const row = { id: 'new-id', uuid: String(data.uuid), ...data };
      seed[row.uuid] = row;
      return Promise.resolve(row as never);
    },
    update(identifier, data) {
      const row = Object.values(seed).find(
        (item) => identifier.id === item.id || identifier.uuid === item.uuid,
      );
      if (!row) return Promise.reject(new Error('not found'));
      Object.assign(row, data);
      return Promise.resolve(row as never);
    },
    delete(identifier) {
      const key = Object.keys(seed).find((item) => {
        const row = seed[item];
        return (
          row !== undefined &&
          (identifier.id === row.id || identifier.uuid === row.uuid)
        );
      });
      if (!key) return Promise.reject(new Error('not found'));
      const row = seed[key];
      if (!row) return Promise.reject(new Error('not found'));
      delete seed[key];
      return Promise.resolve(row as never);
    },
  };
}

function getRepository(
  repositories: Record<string, MasterDataRepository>,
  entity: string,
): MasterDataRepository {
  const repository = repositories[entity];
  if (!repository) throw new Error(`Repository not configured: ${entity}`);
  return repository;
}

describe('MasterDataCrudService', () => {
  it('validates Country -> Region dependency', async () => {
    const repositories = {
      country: repository({ c: { id: 'c', uuid: 'cu' } }),
      region: repository({}),
    } as Record<string, MasterDataRepository>;
    const factory: MasterDataRepositoryFactory = {
      get: (entity) => getRepository(repositories, entity),
    };
    const service = new MasterDataCrudService(factory);
    await expect(
      service.create('region', {
        countryId: 'missing',
        code: 'R',
        name: 'Region',
      }),
    ).rejects.toThrow('missing country');
  });

  it('supports CRUD orchestration without Prisma', async () => {
    const repositories = { country: repository({}) } as Record<
      string,
      MasterDataRepository
    >;
    const service = new MasterDataCrudService({
      get: (entity) => getRepository(repositories, entity),
    });
    const created = await service.create('country', {
      code: 'ID',
      name: 'Indonesia',
      iso2: 'ID',
      iso3: 'IDN',
    });
    expect(created.uuid).toBeTruthy();
    expect((await service.list('country')).total).toBe(1);
    const fetched = await service.get('country', { uuid: created.uuid });
    expect(fetched.id).toBe(created.id);
    const updated = await service.update(
      'country',
      { uuid: created.uuid },
      { name: 'Republic of Indonesia' },
    );
    expect(updated.name).toBe('Republic of Indonesia');
    await service.delete('country', { uuid: created.uuid });
    await expect(
      service.get('country', { uuid: created.uuid }),
    ).rejects.toThrow('not found');
  });
});
