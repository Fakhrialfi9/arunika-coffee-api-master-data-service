import { Global, Module } from '@nestjs/common';

import { DatabaseHealthService } from './database-health.service.js';
import { PrismaTransactionService } from './prisma-transaction.service.js';
import { PrismaService } from './prisma.service.js';
import { PrismaCertificationRepository } from './repositories/prisma-certification.repository.js';
import { PrismaCoffeeBeanRepository } from './repositories/prisma-coffee-bean.repository.js';
import { PrismaCoffeeGradeRepository } from './repositories/prisma-coffee-grade.repository.js';
import { PrismaCountryRepository } from './repositories/prisma-country.repository.js';
import { PrismaFarmRepository } from './repositories/prisma-farm.repository.js';
import { PrismaFarmerRepository } from './repositories/prisma-farmer.repository.js';
import { PrismaFlavorProfileRepository } from './repositories/prisma-flavor-profile.repository.js';
import { PrismaHarvestSeasonRepository } from './repositories/prisma-harvest-season.repository.js';
import { PrismaOrganizationRepository } from './repositories/prisma-organization.repository.js';
import { PrismaProcessingMethodRepository } from './repositories/prisma-processing-method.repository.js';
import { PrismaRegionRepository } from './repositories/prisma-region.repository.js';
import { PrismaSensoryProfileFlavorRepository } from './repositories/prisma-sensory-profile-flavor.repository.js';
import { PrismaSensoryProfileRepository } from './repositories/prisma-sensory-profile.repository.js';
import { PrismaSpeciesRepository } from './repositories/prisma-species.repository.js';
import { PrismaVarietyRepository } from './repositories/prisma-variety.repository.js';

const repositories = [
  PrismaCertificationRepository,
  PrismaCoffeeBeanRepository,
  PrismaCoffeeGradeRepository,
  PrismaCountryRepository,
  PrismaFarmRepository,
  PrismaFarmerRepository,
  PrismaFlavorProfileRepository,
  PrismaHarvestSeasonRepository,
  PrismaOrganizationRepository,
  PrismaProcessingMethodRepository,
  PrismaRegionRepository,
  PrismaSensoryProfileFlavorRepository,
  PrismaSensoryProfileRepository,
  PrismaSpeciesRepository,
  PrismaVarietyRepository,
];

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaTransactionService,
    DatabaseHealthService,
    ...repositories,
  ],
  exports: [
    PrismaService,
    PrismaTransactionService,
    DatabaseHealthService,
    ...repositories,
  ],
})
export class DatabaseModule {}
