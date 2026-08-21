import { Injectable } from '@nestjs/common';
import type { MasterDataEntityName, MasterDataListQuery, MasterDataWrite } from '../../../domain/shared/repositories/master-data.repository.js';
import { MasterDataCrudService } from './master-data-crud.service.js';

export interface CrudRequest { id?: string; uuid?: string; }

@Injectable()
export class MasterDataCrudUseCase {
  constructor(protected readonly service: MasterDataCrudService) {}
  create(entity: MasterDataEntityName, input: MasterDataWrite) { return this.service.create(entity, input); }
  get(entity: MasterDataEntityName, identifier: CrudRequest) { return this.service.get(entity, identifier); }
  list(entity: MasterDataEntityName, query?: MasterDataListQuery) { return this.service.list(entity, query); }
  update(entity: MasterDataEntityName, identifier: CrudRequest, input: MasterDataWrite) { return this.service.update(entity, identifier, input); }
  delete(entity: MasterDataEntityName, identifier: CrudRequest) { return this.service.delete(entity, identifier); }
}
