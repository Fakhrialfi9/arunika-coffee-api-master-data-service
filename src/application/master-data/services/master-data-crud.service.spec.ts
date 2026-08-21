import { describe, expect, it } from 'vitest';
import { MasterDataCrudService } from './master-data-crud.service.js';
import type { MasterDataRepository, MasterDataRepositoryFactory } from '../../../domain/shared/repositories/master-data.repository.js';

function repository(seed: Record<string, Record<string, unknown>>): MasterDataRepository {
  return {
    async findById(id) { return (Object.values(seed).find((row) => row.id === id) as never) ?? null; },
    async findByUuid(uuid) { return (Object.values(seed).find((row) => row.uuid === uuid) as never) ?? null; },
    async list() { return { items: Object.values(seed) as never, page: 1, limit: 25, total: Object.keys(seed).length, totalPages: 1 }; },
    async create(data) { const row = { id: 'new-id', uuid: String(data.uuid), ...data }; seed[row.uuid] = row; return row as never; },
    async update(identifier, data) { const row = Object.values(seed).find((item) => identifier.id === item.id || identifier.uuid === item.uuid); if (!row) throw new Error('not found'); Object.assign(row, data); return row as never; },
    async delete(identifier) { const key = Object.keys(seed).find((item) => identifier.id === seed[item].id || identifier.uuid === seed[item].uuid); if (!key) throw new Error('not found'); const row = seed[key]; delete seed[key]; return row as never; },
  };
}

describe('MasterDataCrudService', () => {
  it('validates Country -> Region dependency', async () => {
    const repositories = { country: repository({ c: { id: 'c', uuid: 'cu' } }), region: repository({}) } as Record<string, MasterDataRepository>;
    const factory: MasterDataRepositoryFactory = { get: (entity) => repositories[entity] };
    const service = new MasterDataCrudService(factory);
    await expect(service.create('region', { countryId: 'missing', code: 'R', name: 'Region' })).rejects.toThrow('missing country');
  });

  it('supports CRUD orchestration without Prisma', async () => {
    const repositories = { country: repository({}) } as Record<string, MasterDataRepository>;
    const service = new MasterDataCrudService({ get: (entity) => repositories[entity] });
    const created = await service.create('country', { code: 'ID', name: 'Indonesia', iso2: 'ID', iso3: 'IDN' });
    expect(created.uuid).toBeTruthy();
    expect((await service.list('country')).total).toBe(1);
    const fetched = await service.get('country', { uuid: created.uuid });
    expect(fetched.id).toBe(created.id);
    const updated = await service.update('country', { uuid: created.uuid }, { name: 'Republic of Indonesia' });
    expect(updated.name).toBe('Republic of Indonesia');
    await service.delete('country', { uuid: created.uuid });
    await expect(service.get('country', { uuid: created.uuid })).rejects.toThrow('not found');
  });
});
