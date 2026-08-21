import { Inject, Injectable } from '@nestjs/common';
import type { MasterDataRepositoryFactory } from '../../../domain/shared/repositories/master-data.repository.js';
import { MASTER_DATA_REPOSITORY_FACTORY } from '../../../domain/shared/repositories/master-data.repository.js';
import {
  SENSORY_PROFILE_FLAVOR_REPOSITORY,
  type SensoryProfileFlavorMapping,
  type SensoryProfileFlavorRepository,
} from '../../../domain/sensory/repositories/sensory-profile-flavor.repository.js';
import { MasterDataValidationError } from '../errors/master-data.errors.js';

@Injectable()
export class SensoryProfileMappingService {
  constructor(
    @Inject(MASTER_DATA_REPOSITORY_FACTORY)
    private readonly factory: MasterDataRepositoryFactory,
    @Inject(SENSORY_PROFILE_FLAVOR_REPOSITORY)
    private readonly mappings: SensoryProfileFlavorRepository,
  ) {}

  async replaceMappings(
    sensoryProfileId: string,
    input: SensoryProfileFlavorMapping[],
  ) {
    const profile = await this.factory
      .get('sensoryProfile')
      .findById(sensoryProfileId);
    if (!profile)
      throw new MasterDataValidationError(
        'sensoryProfileId references a missing sensoryProfile',
      );

    const seen = new Set<string>();
    const normalized = input.map((mapping, index) => {
      if (!mapping?.flavorProfileId?.trim())
        throw new MasterDataValidationError('flavorProfileId is required');
      const flavorProfileId = mapping.flavorProfileId.trim();
      if (seen.has(flavorProfileId))
        throw new MasterDataValidationError(
          `Duplicate flavor mapping: ${flavorProfileId}`,
        );
      seen.add(flavorProfileId);
      const sortOrder = mapping.sortOrder ?? index;
      if (!Number.isInteger(sortOrder) || sortOrder < 0)
        throw new MasterDataValidationError(
          'sortOrder must be a non-negative integer',
        );
      return { flavorProfileId, sortOrder };
    });

    for (const mapping of normalized) {
      const flavor = await this.factory
        .get('flavorProfile')
        .findById(mapping.flavorProfileId);
      if (!flavor)
        throw new MasterDataValidationError(
          `flavorProfileId references a missing flavorProfile: ${mapping.flavorProfileId}`,
        );
    }

    return this.mappings.replaceForProfile(sensoryProfileId, normalized);
  }

  async removeMapping(sensoryProfileId: string, flavorProfileId: string) {
    if (!sensoryProfileId?.trim() || !flavorProfileId?.trim()) {
      throw new MasterDataValidationError(
        'sensoryProfileId and flavorProfileId are required',
      );
    }
    const profile = await this.factory
      .get('sensoryProfile')
      .findById(sensoryProfileId.trim());
    if (!profile)
      throw new MasterDataValidationError(
        'sensoryProfileId references a missing sensoryProfile',
      );
    return this.mappings.removeMapping(
      sensoryProfileId.trim(),
      flavorProfileId.trim(),
    );
  }
}
