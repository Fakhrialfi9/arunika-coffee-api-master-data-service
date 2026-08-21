import { Module } from '@nestjs/common';

import { MASTER_DATA_REPOSITORY_FACTORY } from '../../domain/shared/repositories/master-data.repository.js';
import { SENSORY_PROFILE_FLAVOR_REPOSITORY } from '../../domain/sensory/repositories/sensory-profile-flavor.repository.js';
import { PrismaMasterDataRepositoryFactory } from '../../infrastructure/database/repositories/prisma-master-data-repository.factory.js';
import { PrismaSensoryProfileFlavorRepository } from '../../infrastructure/database/repositories/prisma-sensory-profile-flavor.repository.js';
import { MasterDataCrudService } from './services/master-data-crud.service.js';
import { MasterDataRelationshipService } from './services/master-data-relationship.service.js';
import { SensoryProfileMappingService } from './services/sensory-profile-mapping.service.js';

@Module({
  providers: [
    MasterDataCrudService,
    MasterDataRelationshipService,
    SensoryProfileMappingService,
    PrismaMasterDataRepositoryFactory,
    PrismaSensoryProfileFlavorRepository,
    {
      provide: MASTER_DATA_REPOSITORY_FACTORY,
      useExisting: PrismaMasterDataRepositoryFactory,
    },
    {
      provide: SENSORY_PROFILE_FLAVOR_REPOSITORY,
      useExisting: PrismaSensoryProfileFlavorRepository,
    },
  ],
  exports: [
    MasterDataCrudService,
    MasterDataRelationshipService,
    SensoryProfileMappingService,
    MASTER_DATA_REPOSITORY_FACTORY,
  ],
})
export class MasterDataApplicationModule {}
