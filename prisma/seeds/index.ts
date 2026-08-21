import { PrismaClient } from '../generated/prisma/client.js';
import { seedCertification } from './certification.seed.js';
import { seedCoffeeBean } from './coffee-bean.seed.js';
import { seedCoffeeGrade } from './coffee-grade.seed.js';
import { seedCountry } from './country.seed.js';
import { seedFarm } from './farm.seed.js';
import { seedFarmer } from './farmer.seed.js';
import { seedFlavorProfile } from './flavor-profile.seed.js';
import { seedHarvestSeason } from './harvest-season.seed.js';
import { seedOrganization } from './organization.seed.js';
import { seedProcessingMethod } from './processing-method.seed.js';
import { seedRegion } from './region.seed.js';
import { seedSensoryProfileFlavor } from './sensory-profile-flavor.seed.js';
import { seedSensoryProfile } from './sensory-profile.seed.js';
import { seedSpecies } from './species.seed.js';
import { seedVariety } from './variety.seed.js';

export async function seedMasterData(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const country = await seedCountry(tx);
    const region = await seedRegion(tx, country.id);
    const organization = await seedOrganization(tx, region.id);
    const farmer = await seedFarmer(tx, region.id, organization.id);
    const farm = await seedFarm(tx, farmer.id);
    const species = await seedSpecies(tx);
    const variety = await seedVariety(tx, species.id);
    const processingMethod = await seedProcessingMethod(tx);
    const grade = await seedCoffeeGrade(tx);
    const harvestSeason = await seedHarvestSeason(tx);
    const flavorProfile = await seedFlavorProfile(tx);
    await seedCertification(tx);
    const coffeeBean = await seedCoffeeBean(
      tx,
      region.id,
      farmer.id,
      farm.id,
      species.id,
      variety.id,
      processingMethod.id,
      grade.id,
      harvestSeason.id,
    );
    const sensoryProfile = await seedSensoryProfile(tx, coffeeBean.id);
    await seedSensoryProfileFlavor(tx, sensoryProfile.id, flavorProfile.id);
  });
}
