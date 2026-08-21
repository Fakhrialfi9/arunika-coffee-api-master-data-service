import type { MasterDataRecord, MasterDataWrite } from '../../../domain/shared/repositories/master-data.repository.js';

export function persistenceToApplication(record: MasterDataRecord): MasterDataRecord { return { ...record }; }
export function applicationToPersistence(input: MasterDataWrite): MasterDataWrite { return { ...input }; }
