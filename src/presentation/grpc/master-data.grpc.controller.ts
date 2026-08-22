import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  MasterDataEntityName,
  MasterDataListResult,
  MasterDataRecord,
  MasterDataWrite,
} from '../../domain/shared/repositories/master-data.repository.js';
import { MASTER_DATA_CRUD_ENTITIES } from '../../application/master-data/master-data-crud.resources.js';
import { MasterDataCrudUseCase } from '../../application/master-data/use-cases/master-data-crud.use-case.js';
import { MasterDataRelationshipService } from '../../application/master-data/services/master-data-relationship.service.js';
import { MasterDataValidationError } from '../../application/master-data/errors/master-data.errors.js';

interface HealthResponse {
  service: string;
  status: string;
}

interface CreateMasterDataRequest {
  entity: string;
  dataJson: string;
}

interface GetMasterDataRequest {
  entity: string;
  id?: string;
  uuid?: string;
}

interface ListMasterDataRequest {
  entity: string;
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filtersJson?: string;
}

interface UpdateMasterDataRequest {
  entity: string;
  id?: string;
  uuid?: string;
  dataJson: string;
}

interface DeleteMasterDataRequest {
  entity: string;
  id?: string;
  uuid?: string;
}

interface RelationshipRequest {
  relationship: string;
  id: string;
  page?: number;
  limit?: number;
}

interface MasterDataResponse {
  dataJson: string;
}

interface MasterDataListResponse {
  itemsJson: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ENTITY_NAMES = new Set<string>(MASTER_DATA_CRUD_ENTITIES);
const RELATIONSHIPS = new Set([
  'countryRegions',
  'regionFarmers',
  'farmerFarms',
  'speciesVarieties',
  'coffeeBeanMetadata',
  'sensoryFlavors',
]);

@Controller()
export class MasterDataGrpcController {
  constructor(
    private readonly crud: MasterDataCrudUseCase,
    private readonly relationships: MasterDataRelationshipService,
  ) {}

  @GrpcMethod('MasterDataService', 'GetHealth')
  getHealth(): HealthResponse {
    return {
      service: 'arunika-coffee-api-master-data-service',
      status: 'ok',
    };
  }

  @GrpcMethod('MasterDataService', 'CreateMasterData')
  async createMasterData(
    request: CreateMasterDataRequest,
  ): Promise<MasterDataResponse> {
    const entity = this.entity(request.entity);
    const data = this.parseJsonObject(request.dataJson, 'data_json');
    return this.recordResponse(await this.crud.create(entity, data));
  }

  @GrpcMethod('MasterDataService', 'GetMasterData')
  async getMasterData(
    request: GetMasterDataRequest,
  ): Promise<MasterDataResponse> {
    const entity = this.entity(request.entity);
    if (!request.id && !request.uuid) {
      throw new MasterDataValidationError('id or uuid is required');
    }
    return this.recordResponse(
      await this.crud.get(entity, {
        ...(request.id ? { id: request.id } : {}),
        ...(request.uuid ? { uuid: request.uuid } : {}),
      }),
    );
  }

  @GrpcMethod('MasterDataService', 'ListMasterData')
  async listMasterData(
    request: ListMasterDataRequest,
  ): Promise<MasterDataListResponse> {
    const entity = this.entity(request.entity);
    const filters = request.filtersJson
      ? this.parseJsonObject(request.filtersJson, 'filters_json')
      : undefined;
    const result = await this.crud.list(entity, {
      ...(request.page ? { page: request.page } : {}),
      ...(request.limit ? { limit: request.limit } : {}),
      ...(request.offset ? { offset: request.offset } : {}),
      ...(request.search ? { search: request.search } : {}),
      ...(request.isActive ? { isActive: request.isActive } : {}),
      ...(request.sortBy ? { sortBy: request.sortBy } : {}),
      ...(request.sortOrder ? { sortOrder: request.sortOrder } : {}),
      ...(filters ? { filters } : {}),
    });
    return this.listResponse(result);
  }

  @GrpcMethod('MasterDataService', 'UpdateMasterData')
  async updateMasterData(
    request: UpdateMasterDataRequest,
  ): Promise<MasterDataResponse> {
    const entity = this.entity(request.entity);
    if (!request.id && !request.uuid) {
      throw new MasterDataValidationError('id or uuid is required');
    }
    const data = this.parseJsonObject(request.dataJson, 'data_json');
    return this.recordResponse(
      await this.crud.update(
        entity,
        {
          ...(request.id ? { id: request.id } : {}),
          ...(request.uuid ? { uuid: request.uuid } : {}),
        },
        data,
      ),
    );
  }

  @GrpcMethod('MasterDataService', 'DeleteMasterData')
  async deleteMasterData(
    request: DeleteMasterDataRequest,
  ): Promise<MasterDataResponse> {
    const entity = this.entity(request.entity);
    if (!request.id && !request.uuid) {
      throw new MasterDataValidationError('id or uuid is required');
    }
    return this.recordResponse(
      await this.crud.delete(entity, {
        ...(request.id ? { id: request.id } : {}),
        ...(request.uuid ? { uuid: request.uuid } : {}),
      }),
    );
  }

  @GrpcMethod('MasterDataService', 'GetRelationship')
  async getRelationship(
    request: RelationshipRequest,
  ): Promise<MasterDataListResponse> {
    if (!RELATIONSHIPS.has(request.relationship)) {
      throw new MasterDataValidationError(
        `Unsupported relationship: ${request.relationship}`,
      );
    }
    if (!request.id) {
      throw new MasterDataValidationError('id is required');
    }

    switch (request.relationship) {
      case 'countryRegions':
        return this.listResponse(
          await this.relationships.countryRegions(
            request.id,
            request.page,
            request.limit,
          ),
        );
      case 'regionFarmers':
        return this.listResponse(
          await this.relationships.regionFarmers(
            request.id,
            request.page,
            request.limit,
          ),
        );
      case 'farmerFarms':
        return this.listResponse(
          await this.relationships.farmerFarms(
            request.id,
            request.page,
            request.limit,
          ),
        );
      case 'speciesVarieties':
        return this.listResponse(
          await this.relationships.speciesVarieties(
            request.id,
            request.page,
            request.limit,
          ),
        );
      case 'sensoryFlavors':
        return this.listResponse(
          await this.relationships.sensoryFlavors(
            request.id,
            request.page,
            request.limit,
          ),
        );
      case 'coffeeBeanMetadata':
        return this.listResponse({
          items: [await this.relationships.coffeeBeanMetadata(request.id)],
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
        });
    }
  }

  private entity(value: string): MasterDataEntityName {
    if (!ENTITY_NAMES.has(value)) {
      throw new MasterDataValidationError(`Unsupported master-data entity: ${value}`);
    }
    return value as MasterDataEntityName;
  }

  private parseJsonObject(value: string, field: string): MasterDataWrite {
    if (!value?.trim()) {
      throw new MasterDataValidationError(`${field} is required`);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new MasterDataValidationError(`${field} must contain valid JSON`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new MasterDataValidationError(`${field} must contain a JSON object`);
    }
    return parsed as MasterDataWrite;
  }

  private recordResponse(record: MasterDataRecord): MasterDataResponse {
    return { dataJson: JSON.stringify(record) };
  }

  private listResponse(result: MasterDataListResult): MasterDataListResponse {
    return {
      itemsJson: JSON.stringify(result.items),
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    };
  }
}
