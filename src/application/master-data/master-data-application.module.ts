import { Module } from '@nestjs/common';

import { MASTER_DATA_REPOSITORY_FACTORY } from '../../domain/shared/repositories/master-data.repository.js';
import { PrismaMasterDataRepositoryFactory } from '../../infrastructure/database/repositories/prisma-master-data-repository.factory.js';
import { MasterDataCrudService } from './services/master-data-crud.service.js';

@Module({
  providers: [
    MasterDataCrudService,
    PrismaMasterDataRepositoryFactory,
    { provide: MASTER_DATA_REPOSITORY_FACTORY, useExisting: PrismaMasterDataRepositoryFactory },
  ],
  exports: [MasterDataCrudService, MASTER_DATA_REPOSITORY_FACTORY],
})
export class MasterDataApplicationModule {}
