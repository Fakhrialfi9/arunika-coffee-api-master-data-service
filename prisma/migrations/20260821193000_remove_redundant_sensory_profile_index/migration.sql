-- The unique composite index already starts with sensoryProfileId,
-- so the standalone sensoryProfileId index is redundant.
DROP INDEX `sensory_profile_flavors_sensoryProfileId_idx` ON `sensory_profile_flavors`;
