import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type {
  MasterDataEntityName,
  MasterDataListQuery,
  MasterDataRecord,
  MasterDataRepositoryFactory,
  MasterDataWrite,
} from '../../../domain/shared/repositories/master-data.repository.js';
import { MASTER_DATA_REPOSITORY_FACTORY } from '../../../domain/shared/repositories/master-data.repository.js';
import {
  MasterDataNotFoundError,
  MasterDataValidationError,
} from '../errors/master-data.errors.js';

const SORT_FIELDS = new Set([
  'id',
  'uuid',
  'code',
  'name',
  'sortOrder',
  'createdAt',
  'updatedAt',
  'year',
]);
const FILTER_FIELDS = new Set([
  'regionId',
  'farmerId',
  'farmId',
  'speciesId',
  'varietyId',
  'processingMethodId',
  'gradeId',
  'harvestSeasonId',
]);

@Injectable()
export class MasterDataCrudService {
  constructor(
    @Inject(MASTER_DATA_REPOSITORY_FACTORY)
    private readonly factory: MasterDataRepositoryFactory,
  ) {}

  async create(
    entity: MasterDataEntityName,
    input: MasterDataWrite,
  ): Promise<MasterDataRecord> {
    const data = this.normalizeWrite(input, true);
    await this.validateRelations(entity, data);
    return this.factory.get(entity).create(data);
  }

  async get(
    entity: MasterDataEntityName,
    identifier: { id?: string; uuid?: string },
  ): Promise<MasterDataRecord> {
    const repository = this.factory.get(entity);
    const record = identifier.uuid
      ? await repository.findByUuid(identifier.uuid)
      : identifier.id
        ? await repository.findById(identifier.id)
        : null;
    if (!record) throw new MasterDataNotFoundError(`${entity} was not found`);
    return record;
  }

  async list(entity: MasterDataEntityName, query: MasterDataListQuery = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const offset = query.offset;

    if (!Number.isInteger(page) || page < 1)
      throw new MasterDataValidationError(
        'page must be an integer greater than 0',
      );
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new MasterDataValidationError(
        'limit must be an integer between 1 and 100',
      );
    }
    if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
      throw new MasterDataValidationError(
        'offset must be a non-negative integer',
      );
    }
    if (
      query.sortOrder !== undefined &&
      !['asc', 'desc'].includes(query.sortOrder)
    ) {
      throw new MasterDataValidationError('sortOrder must be asc or desc');
    }
    if (query.sortBy !== undefined && !SORT_FIELDS.has(query.sortBy)) {
      throw new MasterDataValidationError(
        `Unsupported master-data sort field: ${query.sortBy}`,
      );
    }
    for (const field of Object.keys(query.filters ?? {})) {
      if (!FILTER_FIELDS.has(field))
        throw new MasterDataValidationError(
          `Unsupported master-data filter: ${field}`,
        );
    }

    const search = query.search?.trim();
    return this.factory.get(entity).list({
      page,
      limit,
      ...(offset !== undefined ? { offset } : {}),
      ...(search !== undefined ? { search } : {}),
      sortBy: query.sortBy ?? 'sortOrder',
      sortOrder: query.sortOrder ?? 'asc',
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.filters !== undefined ? { filters: query.filters } : {}),
    });
  }

  async update(
    entity: MasterDataEntityName,
    identifier: { id?: string; uuid?: string },
    input: MasterDataWrite,
  ) {
    const current = await this.get(entity, identifier);
    const data = this.normalizeWrite(input, false);
    const merged = { ...current, ...data };
    await this.validateRelations(entity, merged);
    return this.factory.get(entity).update(identifier, data);
  }

  async delete(
    entity: MasterDataEntityName,
    identifier: { id?: string; uuid?: string },
  ) {
    await this.get(entity, identifier);
    return this.factory.get(entity).delete(identifier);
  }

  private normalizeWrite(input: MasterDataWrite, create: boolean): MasterDataWrite {
    const data = { ...input };

    if (create && data.uuid === undefined) data.uuid = randomUUID();

    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string') data[key] = data[key].trim();
    }

    return data;
  }

  private async validateRelations(
    entity: MasterDataEntityName,
    data: MasterDataWrite,
  ): Promise<void> {
    const relationFields: Record<
      MasterDataEntityName,
      readonly string[]
    > = {
      country: [],
      region: ['countryId'],
      organization: ['regionId'],
      farmer: ['regionId', 'organizationId'],
      farm: ['farmerId'],
      species: [],
      variety: ['speciesId'],
      processingMethod: [],
      coffeeGrade: [],
      harvestSeason: [],
      certification: [],
      flavorProfile: [],
      sensoryProfile: ['coffeeBeanId'],
      sensoryProfileFlavor: ['sensoryProfileId', 'flavorProfileId'],
      coffeeBean: [
        'regionId',
        'farmerId',
        'farmId',
        'speciesId',
        'varietyId',
        'processingMethodId',
        'gradeId',
        'harvestSeasonId',
      ],
    };

    const fields = relationFields[entity];
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null) continue;
      if (typeof data[field] !== 'string' || data[field].length === 0) {
        throw new MasterDataValidationError(`${field} must be a non-empty id`);
      }
    }
  }
}
