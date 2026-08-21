import { Injectable } from '@nestjs/common';
import type {
  MasterDataEntityName,
  MasterDataListQuery,
  MasterDataListResult,
  MasterDataQueryArgs,
  MasterDataRecord,
  MasterDataRepository,
  MasterDataRepositoryFactory,
  MasterDataWrite,
} from '../../../domain/shared/repositories/master-data.repository.js';
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

interface PrismaRepositoryLike {
  findById(id: string): Promise<unknown>;
  findByUuid(uuid: string): Promise<unknown>;
  findMany(args?: never): Promise<unknown[]>;
  count(args?: never): Promise<number>;
  create(data: never): Promise<unknown>;
  update(where: never, data: never): Promise<unknown>;
  delete(where: never): Promise<unknown>;
}

const SEARCH_FIELDS: Record<MasterDataEntityName, string[]> = {
  country: ['name', 'code', 'iso2', 'iso3'],
  region: ['name', 'code', 'province', 'district', 'city'],
  organization: ['name', 'code', 'type'],
  farmer: ['name', 'code', 'type'],
  farm: ['name'],
  species: ['name', 'code', 'commonName', 'scientificName'],
  variety: ['name', 'code'],
  processingMethod: ['name', 'code', 'category'],
  coffeeGrade: ['name', 'code', 'category'],
  harvestSeason: ['name', 'label', 'seasonType'],
  certification: ['name', 'code', 'type', 'issuer'],
  flavorProfile: ['name', 'code', 'category'],
  sensoryProfile: ['aroma', 'body', 'acidity', 'sweetness', 'aftertaste', 'description'],
  sensoryProfileFlavor: [],
  coffeeBean: ['name', 'code', 'lotNumber', 'qualityStatus', 'beanSize'],
};

class PrismaRepositoryAdapter implements MasterDataRepository {
  constructor(private readonly entity: MasterDataEntityName, private readonly repository: PrismaRepositoryLike) {}

  async findById(id: string) { return this.record(await this.repository.findById(id)); }
  async findByUuid(uuid: string) { return this.record(await this.repository.findByUuid(uuid)); }

  async findMany(args: MasterDataQueryArgs = {}) {
    const rows = await this.repository.findMany(args as never);
    return rows.map((row) => this.record(row)).filter((row): row is MasterDataRecord => row !== null);
  }

  async list(query: MasterDataListQuery): Promise<MasterDataListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const where = this.buildWhere(query);
    const sortBy = query.sortBy ?? 'sortOrder';
    const sortOrder = query.sortOrder ?? 'asc';
    const args = {
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
    };
    const [rows, total] = await Promise.all([
      this.repository.findMany(args as never),
      this.repository.count({ where } as never),
    ]);
    const items = rows.map((row) => this.record(row)).filter((row): row is MasterDataRecord => row !== null);
    return { items, page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
  }

  async create(data: MasterDataWrite) { return this.record(await this.repository.create(data as never)) as MasterDataRecord; }
  async update(identifier: { id?: string; uuid?: string }, data: MasterDataWrite) {
    return this.record(await this.repository.update(this.where(identifier) as never, data as never)) as MasterDataRecord;
  }
  async delete(identifier: { id?: string; uuid?: string }) {
    return this.record(await this.repository.delete(this.where(identifier) as never)) as MasterDataRecord;
  }

  private buildWhere(query: MasterDataListQuery): Record<string, unknown> {
    const where: Record<string, unknown> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    for (const [field, value] of Object.entries(query.filters ?? {})) {
      if (value !== undefined) where[field] = value;
    }
    const search = query.search?.trim();
    const fields = SEARCH_FIELDS[this.entity];
    if (search && fields.length > 0) where.OR = fields.map((field) => ({ [field]: { contains: search } }));
    return where;
  }

  private where(identifier: { id?: string; uuid?: string }) {
    if (identifier.id) return { id: identifier.id };
    if (identifier.uuid) return { uuid: identifier.uuid };
    throw new Error('id or uuid is required');
  }

  private record(value: unknown): MasterDataRecord | null {
    if (value === null || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.uuid !== 'string') throw new Error('Persistence record must expose id and uuid');
    return record as MasterDataRecord;
  }
}

@Injectable()
export class PrismaMasterDataRepositoryFactory implements MasterDataRepositoryFactory {
  private readonly adapters: Record<MasterDataEntityName, MasterDataRepository>;

  constructor(
    certification: PrismaCertificationRepository,
    coffeeBean: PrismaCoffeeBeanRepository,
    coffeeGrade: PrismaCoffeeGradeRepository,
    country: PrismaCountryRepository,
    farm: PrismaFarmRepository,
    farmer: PrismaFarmerRepository,
    flavorProfile: PrismaFlavorProfileRepository,
    harvestSeason: PrismaHarvestSeasonRepository,
    organization: PrismaOrganizationRepository,
    processingMethod: PrismaProcessingMethodRepository,
    region: PrismaRegionRepository,
    sensoryProfile: PrismaSensoryProfileRepository,
    sensoryProfileFlavor: PrismaSensoryProfileFlavorRepository,
    species: PrismaSpeciesRepository,
    variety: PrismaVarietyRepository,
  ) {
    this.adapters = {
      certification: new PrismaRepositoryAdapter('certification', certification),
      coffeeBean: new PrismaRepositoryAdapter('coffeeBean', coffeeBean),
      coffeeGrade: new PrismaRepositoryAdapter('coffeeGrade', coffeeGrade),
      country: new PrismaRepositoryAdapter('country', country),
      farm: new PrismaRepositoryAdapter('farm', farm),
      farmer: new PrismaRepositoryAdapter('farmer', farmer),
      flavorProfile: new PrismaRepositoryAdapter('flavorProfile', flavorProfile),
      harvestSeason: new PrismaRepositoryAdapter('harvestSeason', harvestSeason),
      organization: new PrismaRepositoryAdapter('organization', organization),
      processingMethod: new PrismaRepositoryAdapter('processingMethod', processingMethod),
      region: new PrismaRepositoryAdapter('region', region),
      sensoryProfile: new PrismaRepositoryAdapter('sensoryProfile', sensoryProfile),
      sensoryProfileFlavor: new PrismaRepositoryAdapter('sensoryProfileFlavor', sensoryProfileFlavor),
      species: new PrismaRepositoryAdapter('species', species),
      variety: new PrismaRepositoryAdapter('variety', variety),
    };
  }

  get(entity: MasterDataEntityName): MasterDataRepository { return this.adapters[entity]; }
}
