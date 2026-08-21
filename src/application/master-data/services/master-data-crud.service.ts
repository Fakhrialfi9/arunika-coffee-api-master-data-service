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
    if (
      offset !== undefined &&
      (!Number.isInteger(offset) || offset < 0)
    ) {
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
      offset,
      search,
      sortBy: query.sortBy ?? 'sortOrder',
      sortOrder: query.sortOrder ?? 'asc',
      isActive: query.isActive,
      filters: query.filters,
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
    delete merged.createdAt;
    delete merged.updatedAt;
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

  private normalizeWrite(
    input: MasterDataWrite,
    creating: boolean,
  ): MasterDataWrite {
    const data = { ...input };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    if (creating && data.uuid === undefined) data.uuid = randomUUID();
    return data;
  }

  private async validateRelations(
    entity: MasterDataEntityName,
    data: MasterDataWrite,
  ): Promise<void> {
    const exists = async (
      target: MasterDataEntityName,
      id: unknown,
      field: string,
      required = false,
    ) => {
      if (id === undefined || id === null || id === '') {
        if (required)
          throw new MasterDataValidationError(`${entity}.${field} is required`);
        return null;
      }
      const normalizedId = this.toIdentifier(id);
      if (!normalizedId)
        throw new MasterDataValidationError(
          `${entity}.${field} must be a valid identifier`,
        );
      const record = await this.factory.get(target).findById(normalizedId);
      if (!record)
        throw new MasterDataValidationError(
          `${entity}.${field} references a missing ${target}`,
        );
      return record;
    };

    if (entity === 'region')
      await exists('country', data.countryId, 'countryId', true);
    if (entity === 'organization')
      await exists('region', data.regionId, 'regionId', true);
    if (entity === 'farmer') {
      const region = await exists('region', data.regionId, 'regionId', true);
      const organization = await exists(
        'organization',
        data.organizationId,
        'organizationId',
      );
      if (
        organization &&
        region &&
        String(organization.regionId) !== String(region.id)
      ) {
        throw new MasterDataValidationError(
          'Farmer organizationId must belong to regionId',
        );
      }
    }
    if (entity === 'farm')
      await exists('farmer', data.farmerId, 'farmerId', true);
    if (entity === 'variety')
      await exists('species', data.speciesId, 'speciesId', true);
    if (entity === 'sensoryProfile')
      await exists('coffeeBean', data.coffeeBeanId, 'coffeeBeanId', true);
    if (entity === 'sensoryProfileFlavor') {
      await exists(
        'sensoryProfile',
        data.sensoryProfileId,
        'sensoryProfileId',
        true,
      );
      await exists(
        'flavorProfile',
        data.flavorProfileId,
        'flavorProfileId',
        true,
      );
      if (
        data.sortOrder !== undefined &&
        (!Number.isInteger(data.sortOrder) || Number(data.sortOrder) < 0)
      ) {
        throw new MasterDataValidationError(
          'SensoryProfileFlavor.sortOrder must be a non-negative integer',
        );
      }
    }

    if (entity === 'coffeeBean') {
      const region = await exists('region', data.regionId, 'regionId', true);
      const species = await exists(
        'species',
        data.speciesId,
        'speciesId',
        true,
      );
      await exists(
        'processingMethod',
        data.processingMethodId,
        'processingMethodId',
        true,
      );
      const farmer = await exists('farmer', data.farmerId, 'farmerId');
      const farm = await exists('farm', data.farmId, 'farmId');
      const variety = await exists('variety', data.varietyId, 'varietyId');
      await exists('coffeeGrade', data.gradeId, 'gradeId');
      await exists('harvestSeason', data.harvestSeasonId, 'harvestSeasonId');
      if (variety && String(variety.speciesId) !== String(species?.id)) {
        throw new MasterDataValidationError(
          'CoffeeBean varietyId must belong to the selected speciesId',
        );
      }
      if (farm && farmer && String(farm.farmerId) !== String(farmer.id)) {
        throw new MasterDataValidationError(
          'CoffeeBean farmId must belong to farmerId',
        );
      }
      if (farmer && region && String(farmer.regionId) !== String(region.id)) {
        throw new MasterDataValidationError(
          'CoffeeBean farmerId must belong to regionId',
        );
      }
      this.validateCoffeeBeanNumbers(data);
    }
    if (entity === 'harvestSeason') this.validateHarvestSeason(data);
    if (entity === 'farm') this.validateFarmNumbers(data);
    if (entity === 'farmer')
      this.validateYear(data.farmingSinceYear, 'farmingSinceYear');
    if (entity === 'organization')
      this.validateYear(data.establishedYear, 'establishedYear');
  }

  private validateCoffeeBeanNumbers(data: MasterDataWrite): void {
    this.nonNegative(data.cuppingScore, 'cuppingScore');
    if (data.cuppingScore !== undefined && Number(data.cuppingScore) > 100)
      throw new MasterDataValidationError(
        'cuppingScore must be between 0 and 100',
      );
    this.nonNegative(data.moisture, 'moisture');
    if (data.moisture !== undefined && Number(data.moisture) > 100)
      throw new MasterDataValidationError('moisture must be between 0 and 100');
    this.nonNegative(data.density, 'density');
    this.nonNegative(data.availableWeight, 'availableWeight');
    this.nonNegative(data.reservedWeight, 'reservedWeight');
    this.nonNegative(data.sortOrder, 'sortOrder');
  }

  private validateFarmNumbers(data: MasterDataWrite): void {
    this.nonNegative(data.area, 'area');
    this.nonNegative(data.altitudeMin, 'altitudeMin');
    this.nonNegative(data.altitudeMax, 'altitudeMax');
    if (
      data.altitudeMin !== undefined &&
      data.altitudeMax !== undefined &&
      Number(data.altitudeMin) > Number(data.altitudeMax)
    ) {
      throw new MasterDataValidationError(
        'altitudeMin must not exceed altitudeMax',
      );
    }
    if (
      data.latitude !== undefined &&
      (Number(data.latitude) < -90 || Number(data.latitude) > 90)
    )
      throw new MasterDataValidationError(
        'latitude must be between -90 and 90',
      );
    if (
      data.longitude !== undefined &&
      (Number(data.longitude) < -180 || Number(data.longitude) > 180)
    )
      throw new MasterDataValidationError(
        'longitude must be between -180 and 180',
      );
  }

  private validateHarvestSeason(data: MasterDataWrite): void {
    this.validateYear(data.year, 'year');
    for (const field of ['startMonth', 'endMonth']) {
      const value = data[field];
      if (
        value !== undefined &&
        value !== null &&
        (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 12)
      ) {
        throw new MasterDataValidationError(
          `${field} must be an integer between 1 and 12`,
        );
      }
    }
  }

  private validateYear(value: unknown, field: string): void {
    if (value === undefined || value === null) return;
    if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 9999)
      throw new MasterDataValidationError(`${field} must be a valid year`);
  }

  private nonNegative(value: unknown, field: string): void {
    if (value === undefined || value === null) return;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      throw new MasterDataValidationError(
        `${field} must be a non-negative number`,
      );
  }

  private toIdentifier(value: unknown): string | null {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value))
      return String(value);
    return null;
  }
}
