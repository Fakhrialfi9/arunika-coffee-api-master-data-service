-- Restore the lookup index required for joins and filtering by sensory profile.
CREATE INDEX `sensory_profile_flavors_sensoryProfileId_idx`
ON `sensory_profile_flavors`(`sensoryProfileId`);
