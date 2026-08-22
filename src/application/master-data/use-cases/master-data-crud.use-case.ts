import { Injectable } from '@nestjs/common';
import type {
  MasterDataEntityName,
  MasterDataListQuery,
  MasterDataRecord,
  MasterDataRepositoryFactory,
  MasterDataWrite,
} from '../../../domain/shared/repositories/master-data.repository.js';
import { MasterDataCrudService } from '../services/master-data-crud.service.js';

export interface CrudRequest {
  id?: string;
  uuid?: string;
}

@Injectable()
export class MasterDataCrudUseCase {
  constructor(protected readonly service: MasterDataCrudService) {}

  create(
    entity: MasterDataEntityName,
    input: MasterDataWrite,
  ): ReturnType<MasterDataRepositoryFactory['get']> extends infer _T
    ? Promise<MasterDataRecord>
    : never {
    return this.service.create(entity, input);
  }

  get(
    entity: MasterDataEntityName,
    identifier: CrudRequest,
  ): Promise<MasterDataRecord> {
    return this.service.get(entity, identifier);
  }

  list(
    entity: MasterDataEntityName,
    query?: MasterDataListQuery,
  ): ReturnType<MasterDataCrudService['list']> {
    return this.service.list(entity, query);
  }

  update(
    entity: MasterDataEntityName,
    identifier: CrudRequest,
    input: MasterDataWrite,
  ): ReturnType<MasterDataCrudService['update']> {
    return this.service.update(entity, identifier, input);
  }

  delete(
    entity: MasterDataEntityName,
    identifier: CrudRequest,
  ): ReturnType<MasterDataCrudService['delete']> {
    return this.service.delete(entity, identifier);
  }
}
