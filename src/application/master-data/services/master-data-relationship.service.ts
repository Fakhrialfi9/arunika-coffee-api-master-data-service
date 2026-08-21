import { Inject, Injectable } from '@nestjs/common';
import type { MasterDataListResult, MasterDataRecord, MasterDataRepositoryFactory } from '../../../domain/shared/repositories/master-data.repository.js';
import { MASTER_DATA_REPOSITORY_FACTORY } from '../../../domain/shared/repositories/master-data.repository.js';
import { MasterDataNotFoundError } from '../errors/master-data.errors.js';

@Injectable()
export class MasterDataRelationshipService {
  constructor(@Inject(MASTER_DATA_REPOSITORY_FACTORY) private readonly factory: MasterDataRepositoryFactory) {}

  async countryRegions(countryId: string, page = 1, limit = 25): Promise<MasterDataListResult> {
    return this.collection('country', countryId, 'region', 'countryId', page, limit);
  }

  async regionFarmers(regionId: string, page = 1, limit = 25): Promise<MasterDataListResult> {
    return this.collection('region', regionId, 'farmer', 'regionId', page, limit);
  }

  async farmerFarms(farmerId: string, page = 1, limit = 25): Promise<MasterDataListResult> {
    return this.collection('farmer', farmerId, 'farm', 'farmerId', page, limit);
  }

  async speciesVarieties(speciesId: string, page = 1, limit = 25): Promise<MasterDataListResult> {
    return this.collection('species', speciesId, 'variety', 'speciesId', page, limit);
  }

  async coffeeBeanMetadata(id: string): Promise<MasterDataRecord> {
    const bean = await this.factory.get('coffeeBean').findMany({
      where: { id },
      include: {
        region: true,
        farmer: true,
        farm: true,
        species: true,
        variety: true,
        processingMethod: true,
        grade: true,
        harvestSeason: true,
        sensoryProfile: {
          include: {
            sensoryProfileFlavors: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              include: { flavorProfile: true },
            },
          },
        },
      },
      take: 1,
    });
    if (!bean[0]) throw new MasterDataNotFoundError('coffeeBean was not found');
    return bean[0];
  }

  async sensoryFlavors(sensoryProfileId: string, page = 1, limit = 25): Promise<MasterDataListResult> {
    const profile = await this.factory.get('sensoryProfile').findById(sensoryProfileId);
    if (!profile) throw new MasterDataNotFoundError('sensoryProfile was not found');
    const repository = this.factory.get('sensoryProfileFlavor');
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      repository.findMany({
        where: { sensoryProfileId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: { flavorProfile: true },
      }),
      repository.list({ page: 1, limit: 1, filters: { sensoryProfileId } }).then((result) => result.total),
    ]);
    return { items, page: safePage, limit: safeLimit, total, totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit) };
  }

  private async collection(
    parentEntity: 'country' | 'region' | 'farmer' | 'species',
    parentId: string,
    childEntity: 'region' | 'farmer' | 'farm' | 'variety',
    foreignKey: string,
    page: number,
    limit: number,
  ): Promise<MasterDataListResult> {
    const parent = await this.factory.get(parentEntity).findById(parentId);
    if (!parent) throw new MasterDataNotFoundError(`${parentEntity} was not found`);
    return this.factory.get(childEntity).list({
      page,
      limit,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
      filters: { [foreignKey]: parentId },
    });
  }
}
