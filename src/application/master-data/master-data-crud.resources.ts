import type { MasterDataEntityName } from '../../domain/shared/repositories/master-data.repository.js';

/**
 * Master Data CRUD scope exposed by the application layer.
 *
 * The values intentionally use the domain entity names rather than Prisma
 * model names, keeping the application contract independent from persistence.
 */
export const MASTER_DATA_CRUD_ENTITIES = [
  'country',
  'region',
  'organization',
  'farmer',
  'farm',
  'species',
  'variety',
  'processingMethod',
  'coffeeGrade',
  'harvestSeason',
  'certification',
  'flavorProfile',
  'coffeeBean',
] as const satisfies readonly MasterDataEntityName[];

export const MASTER_DATA_CRUD_OPERATIONS = [
  'create',
  'get',
  'list',
  'update',
  'delete',
] as const;
