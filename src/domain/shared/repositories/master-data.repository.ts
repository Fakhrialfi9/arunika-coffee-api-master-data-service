export type MasterDataEntityName =
  | 'country'
  | 'region'
  | 'organization'
  | 'farmer'
  | 'farm'
  | 'species'
  | 'variety'
  | 'processingMethod'
  | 'coffeeGrade'
  | 'harvestSeason'
  | 'certification'
  | 'flavorProfile'
  | 'sensoryProfile'
  | 'sensoryProfileFlavor'
  | 'coffeeBean';

export interface MasterDataRecord {
  id: string;
  uuid: string;
  [key: string]: unknown;
}

export type MasterDataWrite = Record<string, unknown>;

export interface MasterDataListQuery {
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean | undefined>;
}

export interface MasterDataQueryArgs {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: unknown;
  skip?: number;
  take?: number;
}

export interface MasterDataListResult<
  T extends MasterDataRecord = MasterDataRecord,
> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MasterDataRepository<
  T extends MasterDataRecord = MasterDataRecord,
> {
  findById(id: string): Promise<T | null>;
  findByUuid(uuid: string): Promise<T | null>;
  findMany(args?: MasterDataQueryArgs): Promise<T[]>;
  list(query: MasterDataListQuery): Promise<MasterDataListResult<T>>;
  create(data: MasterDataWrite): Promise<T>;
  update(
    identifier: { id?: string; uuid?: string },
    data: MasterDataWrite,
  ): Promise<T>;
  delete(identifier: { id?: string; uuid?: string }): Promise<T>;
}

export const MASTER_DATA_REPOSITORY_FACTORY = Symbol(
  'MASTER_DATA_REPOSITORY_FACTORY',
);

export interface MasterDataRepositoryFactory {
  get(entity: MasterDataEntityName): MasterDataRepository;
}
