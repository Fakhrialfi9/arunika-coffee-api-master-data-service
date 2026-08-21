import type { MasterDataRecord } from '../../shared/repositories/master-data.repository.js';

export interface SensoryProfileFlavorMapping {
  flavorProfileId: string;
  sortOrder?: number;
}

export interface SensoryProfileFlavorRepository {
  replaceForProfile(
    sensoryProfileId: string,
    mappings: SensoryProfileFlavorMapping[],
  ): Promise<MasterDataRecord[]>;
  removeMapping(
    sensoryProfileId: string,
    flavorProfileId: string,
  ): Promise<MasterDataRecord>;
}

export const SENSORY_PROFILE_FLAVOR_REPOSITORY = Symbol(
  'SENSORY_PROFILE_FLAVOR_REPOSITORY',
);
