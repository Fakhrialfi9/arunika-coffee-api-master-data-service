import type {
  MasterDataEntityName,
  MasterDataListQuery,
  MasterDataWrite,
} from '../../../domain/shared/repositories/master-data.repository.js';

export interface CreateMasterDataDto extends MasterDataWrite {
  entity?: MasterDataEntityName;
}

export interface UpdateMasterDataDto extends MasterDataWrite {
  entity?: MasterDataEntityName;
}

export interface GetMasterDataDto {
  id?: string;
  uuid?: string;
}

export type ListMasterDataDto = MasterDataListQuery;

export function assertMasterDataWrite(
  value: unknown,
): asserts value is MasterDataWrite {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new TypeError('Master data input must be an object');
}
