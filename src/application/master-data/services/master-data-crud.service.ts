import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { MasterDataEntityName, MasterDataListQuery, MasterDataRecord, MasterDataRepositoryFactory, MasterDataWrite } from '../../../domain/shared/repositories/master-data.repository.js';
import { MASTER_DATA_REPOSITORY_FACTORY } from '../../../domain/shared/repositories/master-data.repository.js';
import { MasterDataNotFoundError, MasterDataValidationError } from '../errors/master-data.errors.js';

@Injectable()
export class MasterDataCrudService {
  constructor(@Inject(MASTER_DATA_REPOSITORY_FACTORY) private readonly factory: MasterDataRepositoryFactory) {}

  async create(entity: MasterDataEntityName, input: MasterDataWrite): Promise<MasterDataRecord> {
    const data = this.normalizeWrite(input, true);
    await this.validateRelations(entity, data);
    return this.factory.get(entity).create(data);
  }

  async get(entity: MasterDataEntityName, identifier: { id?: string; uuid?: string }): Promise<MasterDataRecord> {
    const repository = this.factory.get(entity);
    const record = identifier.uuid ? await repository.findByUuid(identifier.uuid) : identifier.id ? await repository.findById(identifier.id) : null;
    if (!record) throw new MasterDataNotFoundError(`${entity} was not found`);
    return record;
  }

  async list(entity: MasterDataEntityName, query: MasterDataListQuery = {}) {
    return this.factory.get(entity).list({ page: 1, limit: 25, sortBy: 'sortOrder', sortOrder: 'asc', ...query });
  }

  async update(entity: MasterDataEntityName, identifier: { id?: string; uuid?: string }, input: MasterDataWrite) {
    const current = await this.get(entity, identifier);
    const data = this.normalizeWrite(input, false);
    const merged = { ...current, ...data };
    delete merged.createdAt;
    delete merged.updatedAt;
    await this.validateRelations(entity, merged);
    return this.factory.get(entity).update(identifier, data);
  }

  async delete(entity: MasterDataEntityName, identifier: { id?: string; uuid?: string }) {
    await this.get(entity, identifier);
    return this.factory.get(entity).delete(identifier);
  }

  private normalizeWrite(input: MasterDataWrite, creating: boolean): MasterDataWrite {
    const data = { ...input };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    if (creating && data.uuid === undefined) data.uuid = randomUUID();
    return data;
  }

  private async validateRelations(entity: MasterDataEntityName, data: MasterDataWrite): Promise<void> {
    const exists = async (target: MasterDataEntityName, id: unknown, field: string, required = false) => {
      if (id === undefined || id === null || id === '') { if (required) throw new MasterDataValidationError(`${entity}.${field} is required`); return null; }
      const record = await this.factory.get(target).findById(String(id));
      if (!record) throw new MasterDataValidationError(`${entity}.${field} references a missing ${target}`);
      return record;
    };

    if (entity === 'region') await exists('country', data.countryId, 'countryId', true);
    if (entity === 'organization') await exists('region', data.regionId, 'regionId', true);
    if (entity === 'farmer') {
      const region = await exists('region', data.regionId, 'regionId', true);
      const organization = await exists('organization', data.organizationId, 'organizationId');
      if (organization && region && String(organization.regionId) !== String(region.id)) throw new MasterDataValidationError('Farmer organizationId must belong to regionId');
    }
    if (entity === 'farm') await exists('farmer', data.farmerId, 'farmerId', true);
    if (entity === 'variety') await exists('species', data.speciesId, 'speciesId', true);
    if (entity === 'coffeeBean') {
      const region = await exists('region', data.regionId, 'regionId', true);
      const species = await exists('species', data.speciesId, 'speciesId', true);
      await exists('processingMethod', data.processingMethodId, 'processingMethodId', true);
      const farmer = await exists('farmer', data.farmerId, 'farmerId');
      const farm = await exists('farm', data.farmId, 'farmId');
      await exists('variety', data.varietyId, 'varietyId');
      await exists('coffeeGrade', data.gradeId, 'gradeId');
      await exists('harvestSeason', data.harvestSeasonId, 'harvestSeasonId');

      if (data.varietyId) {
        const variety = await this.factory.get('variety').findById(String(data.varietyId));
        if (variety && String(variety.speciesId) !== String(species?.id)) throw new MasterDataValidationError('CoffeeBean varietyId must belong to the selected speciesId');
      }
      if (farm && farmer && String(farm.farmerId) !== String(farmer.id)) throw new MasterDataValidationError('CoffeeBean farmId must belong to farmerId');
      if (farmer && region && String(farmer.regionId) !== String(region.id)) throw new MasterDataValidationError('CoffeeBean farmerId must belong to regionId');
    }
  }
}
