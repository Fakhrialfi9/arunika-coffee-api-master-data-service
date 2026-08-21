import { Injectable } from '@nestjs/common';
import type { MasterDataEntityName, MasterDataListQuery, MasterDataListResult, MasterDataRecord, MasterDataRepository, MasterDataRepositoryFactory, MasterDataWrite } from '../../../domain/shared/repositories/master-data.repository.js';
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
import { PrismaSpeciesRepository } from './prisma-species.repository.js';
import { PrismaVarietyRepository } from './prisma-variety.repository.js';

interface PrismaRepositoryLike { findById(id: string): Promise<unknown>; findByUuid(uuid: string): Promise<unknown>; findMany(args?: never): Promise<unknown[]>; count(args?: never): Promise<number>; create(data: never): Promise<unknown>; update(where: never, data: never): Promise<unknown>; delete(where: never): Promise<unknown>; }

class PrismaRepositoryAdapter implements MasterDataRepository {
  constructor(private readonly repository: PrismaRepositoryLike) {}
  async findById(id: string) { return this.record(await this.repository.findById(id)); }
  async findByUuid(uuid: string) { return this.record(await this.repository.findByUuid(uuid)); }
  async list(query: MasterDataListQuery): Promise<MasterDataListResult> {
    const page = Math.max(1, query.page ?? 1); const limit = Math.min(100, Math.max(1, query.limit ?? 25));
    const where: Record<string, unknown> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search?.trim()) where.name = { contains: query.search.trim() };
    const sortBy = query.sortBy ?? 'sortOrder';
    if (!['id', 'uuid', 'code', 'name', 'sortOrder', 'createdAt', 'updatedAt', 'year'].includes(sortBy)) throw new Error(`Unsupported master-data sort field: ${sortBy}`);
    const args = { where, skip: (page - 1) * limit, take: limit, orderBy: { [sortBy]: query.sortOrder ?? 'asc' } };
    const [rows, total] = await Promise.all([this.repository.findMany(args as never), this.repository.count({ where } as never)]);
    const items = rows.map((row) => this.record(row)).filter((row): row is MasterDataRecord => row !== null);
    return { items, page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
  }
  async create(data: MasterDataWrite) { return this.record(await this.repository.create(data as never)) as MasterDataRecord; }
  async update(identifier: { id?: string; uuid?: string }, data: MasterDataWrite) { return this.record(await this.repository.update(this.where(identifier), data as never)) as MasterDataRecord; }
  async delete(identifier: { id?: string; uuid?: string }) { return this.record(await this.repository.delete(this.where(identifier))) as MasterDataRecord; }
  private where(identifier: { id?: string; uuid?: string }) { if (identifier.id) return { id: identifier.id }; if (identifier.uuid) return { uuid: identifier.uuid }; throw new Error('id or uuid is required'); }
  private record(value: unknown): MasterDataRecord | null { if (value === null || typeof value !== 'object') return null; const record = value as Record<string, unknown>; if (typeof record.id !== 'string' || typeof record.uuid !== 'string') throw new Error('Persistence record must expose id and uuid'); return record as MasterDataRecord; }
}

@Injectable()
export class PrismaMasterDataRepositoryFactory implements MasterDataRepositoryFactory {
  private readonly adapters: Record<MasterDataEntityName, MasterDataRepository>;
  constructor(certification: PrismaCertificationRepository, coffeeBean: PrismaCoffeeBeanRepository, coffeeGrade: PrismaCoffeeGradeRepository, country: PrismaCountryRepository, farm: PrismaFarmRepository, farmer: PrismaFarmerRepository, flavorProfile: PrismaFlavorProfileRepository, harvestSeason: PrismaHarvestSeasonRepository, organization: PrismaOrganizationRepository, processingMethod: PrismaProcessingMethodRepository, region: PrismaRegionRepository, species: PrismaSpeciesRepository, variety: PrismaVarietyRepository) {
    this.adapters = { certification: new PrismaRepositoryAdapter(certification), coffeeBean: new PrismaRepositoryAdapter(coffeeBean), coffeeGrade: new PrismaRepositoryAdapter(coffeeGrade), country: new PrismaRepositoryAdapter(country), farm: new PrismaRepositoryAdapter(farm), farmer: new PrismaRepositoryAdapter(farmer), flavorProfile: new PrismaRepositoryAdapter(flavorProfile), harvestSeason: new PrismaRepositoryAdapter(harvestSeason), organization: new PrismaRepositoryAdapter(organization), processingMethod: new PrismaRepositoryAdapter(processingMethod), region: new PrismaRepositoryAdapter(region), species: new PrismaRepositoryAdapter(species), variety: new PrismaRepositoryAdapter(variety) };
  }
  get(entity: MasterDataEntityName): MasterDataRepository { return this.adapters[entity]; }
}
