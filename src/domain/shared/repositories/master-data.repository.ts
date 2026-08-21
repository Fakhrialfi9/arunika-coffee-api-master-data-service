export type MasterDataEntityName =
  | 'country' | 'region' | 'organization' | 'farmer' | 'farm'
  | 'species' | 'variety' | 'processingMethod' | 'coffeeGrade'
  | 'harvestSeason' | 'certification' | 'flavorProfile' | 'coffeeBean';

export type MasterDataRecord = Record<string, unknown> & { id: string; uuid: string };
export type MasterDataWrite = Record<string, unknown>;

export interface MasterDataListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MasterDataListResult<T extends MasterDataRecord = MasterDataRecord> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MasterDataRepository<T extends MasterDataRecord = MasterDataRecord> {
  findById(id: string): Promise<T | null>;
  findByUuid(uuid: string): Promise<T | null>;
  list(query: MasterDataListQuery): Promise<MasterDataListResult<T>>;
  create(data: MasterDataWrite): Promise<T>;
  update(identifier: { id?: string; uuid?: string }, data: MasterDataWrite): Promise<T>;
  delete(identifier: { id?: string; uuid?: string }): Promise<T>;
}

export const MASTER_DATA_REPOSITORY_FACTORY = Symbol('MASTER_DATA_REPOSITORY_FACTORY');
export interface MasterDataRepositoryFactory { get(entity: MasterDataEntityName): MasterDataRepository; }
