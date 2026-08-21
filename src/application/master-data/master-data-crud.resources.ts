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

/**
 * Stable resource slugs used by presentation/transport adapters.
 * Keeping these names here makes the CRUD surface explicit without coupling
 * the domain to HTTP or gRPC naming conventions.
 */
export const MASTER_DATA_CRUD_RESOURCE_SLUGS = [
  'country',
  'region',
  'organization',
  'farmer',
  'farm',
  'species',
  'variety',
  'processing',
  'coffee-grade',
  'harvest',
  'certification',
  'flavor',
  'coffee-bean',
] as const;

export const MASTER_DATA_CRUD_OPERATIONS = [
  'create',
  'get',
  'list',
  'update',
  'delete',
] as const;
