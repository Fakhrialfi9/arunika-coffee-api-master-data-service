-- CreateTable
CREATE TABLE `certifications` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `issuer` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `countryScope` VARCHAR(191) NULL,
    `requiresExpiration` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `certifications_uuid_key`(`uuid`),
    UNIQUE INDEX `certifications_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coffee_beans` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `lotNumber` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `regionId` VARCHAR(191) NOT NULL,
    `farmerId` VARCHAR(191) NULL,
    `farmId` VARCHAR(191) NULL,
    `speciesId` VARCHAR(191) NOT NULL,
    `varietyId` VARCHAR(191) NULL,
    `processingMethodId` VARCHAR(191) NOT NULL,
    `gradeId` VARCHAR(191) NULL,
    `harvestSeasonId` VARCHAR(191) NULL,
    `cuppingScore` DOUBLE NULL,
    `moisture` DOUBLE NULL,
    `density` DOUBLE NULL,
    `beanSize` VARCHAR(191) NULL,
    `qualityStatus` VARCHAR(191) NULL,
    `flavorProfiles` JSON NULL,
    `aromaNotes` JSON NULL,
    `availableWeight` DOUBLE NULL,
    `reservedWeight` DOUBLE NULL,
    `weightUnit` VARCHAR(191) NOT NULL DEFAULT 'kg',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coffee_beans_uuid_key`(`uuid`),
    UNIQUE INDEX `coffee_beans_code_key`(`code`),
    INDEX `coffee_beans_regionId_idx`(`regionId`),
    INDEX `coffee_beans_farmerId_idx`(`farmerId`),
    INDEX `coffee_beans_farmId_idx`(`farmId`),
    INDEX `coffee_beans_speciesId_idx`(`speciesId`),
    INDEX `coffee_beans_harvestSeasonId_idx`(`harvestSeasonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coffee_grades` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `standard` VARCHAR(191) NULL,
    `minimumCuppingScore` DOUBLE NULL,
    `maxDefectCount` INTEGER NULL,
    `exportEligible` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `coffee_grades_uuid_key`(`uuid`),
    UNIQUE INDEX `coffee_grades_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `officialName` VARCHAR(191) NULL,
    `shortName` VARCHAR(191) NULL,
    `iso2` VARCHAR(191) NOT NULL,
    `iso3` VARCHAR(191) NOT NULL,
    `continent` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL,
    `phoneCode` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NULL,
    `currencyCode` VARCHAR(191) NULL,
    `isCoffeeOrigin` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `countries_uuid_key`(`uuid`),
    UNIQUE INDEX `countries_code_key`(`code`),
    UNIQUE INDEX `countries_iso2_key`(`iso2`),
    UNIQUE INDEX `countries_iso3_key`(`iso3`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farms` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `farmerId` VARCHAR(191) NOT NULL,
    `area` DOUBLE NULL,
    `areaUnit` VARCHAR(191) NULL DEFAULT 'hectare',
    `establishedYear` INTEGER NULL,
    `altitudeMin` INTEGER NULL,
    `altitudeMax` INTEGER NULL,
    `altitudeUnit` VARCHAR(191) NULL DEFAULT 'MASL',
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `soilType` VARCHAR(191) NULL,
    `climate` VARCHAR(191) NULL,
    `farmingPractice` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `farms_uuid_key`(`uuid`),
    INDEX `farms_farmerId_idx`(`farmerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farmers` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `regionId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `farmingSinceYear` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `story` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `farmers_uuid_key`(`uuid`),
    UNIQUE INDEX `farmers_code_key`(`code`),
    INDEX `farmers_regionId_idx`(`regionId`),
    INDEX `farmers_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flavor_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `flavor_profiles_uuid_key`(`uuid`),
    UNIQUE INDEX `flavor_profiles_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `harvest_seasons` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `year` INTEGER NOT NULL,
    `seasonType` VARCHAR(191) NULL,
    `startMonth` INTEGER NULL,
    `endMonth` INTEGER NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `harvest_seasons_uuid_key`(`uuid`),
    INDEX `harvest_seasons_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `regionId` VARCHAR(191) NOT NULL,
    `contactName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `establishedYear` INTEGER NULL,
    `memberCount` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `organizations_uuid_key`(`uuid`),
    UNIQUE INDEX `organizations_code_key`(`code`),
    INDEX `organizations_regionId_idx`(`regionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `processing_methods` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `fermentation` BOOLEAN NOT NULL DEFAULT false,
    `fermentationType` VARCHAR(191) NULL,
    `fermentationDuration` VARCHAR(191) NULL,
    `dryingMethod` VARCHAR(191) NULL,
    `dryingDuration` VARCHAR(191) NULL,
    `processingSteps` JSON NULL,
    `parameters` JSON NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `processing_methods_uuid_key`(`uuid`),
    UNIQUE INDEX `processing_methods_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regions` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `village` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `altitudeMin` INTEGER NULL,
    `altitudeMax` INTEGER NULL,
    `altitudeUnit` VARCHAR(191) NULL DEFAULT 'MASL',
    `climate` VARCHAR(191) NULL,
    `soilType` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `regions_uuid_key`(`uuid`),
    UNIQUE INDEX `regions_code_key`(`code`),
    INDEX `regions_countryId_idx`(`countryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sensory_profile_flavors` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `sensoryProfileId` VARCHAR(191) NOT NULL,
    `flavorProfileId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sensory_profile_flavors_uuid_key`(`uuid`),
    INDEX `sensory_profile_flavors_sensoryProfileId_idx`(`sensoryProfileId`),
    INDEX `sensory_profile_flavors_flavorProfileId_idx`(`flavorProfileId`),
    UNIQUE INDEX `sensory_profile_flavors_sensoryProfileId_flavorProfileId_key`(`sensoryProfileId`, `flavorProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sensory_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `coffeeBeanId` VARCHAR(191) NOT NULL,
    `cuppingScore` DOUBLE NULL,
    `aroma` VARCHAR(191) NULL,
    `body` VARCHAR(191) NULL,
    `acidity` VARCHAR(191) NULL,
    `sweetness` VARCHAR(191) NULL,
    `aftertaste` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sensory_profiles_uuid_key`(`uuid`),
    UNIQUE INDEX `sensory_profiles_coffeeBeanId_key`(`coffeeBeanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `species` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `commonName` VARCHAR(191) NULL,
    `scientificName` VARCHAR(191) NULL,
    `originRegion` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `species_uuid_key`(`uuid`),
    UNIQUE INDEX `species_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `varieties` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `speciesId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `geneticBackground` VARCHAR(191) NULL,
    `originCountry` VARCHAR(191) NULL,
    `plantCharacteristics` JSON NULL,
    `flavorCharacteristics` JSON NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `varieties_uuid_key`(`uuid`),
    UNIQUE INDEX `varieties_code_key`(`code`),
    INDEX `varieties_speciesId_idx`(`speciesId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `regions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_farmerId_fkey` FOREIGN KEY (`farmerId`) REFERENCES `farmers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_farmId_fkey` FOREIGN KEY (`farmId`) REFERENCES `farms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_speciesId_fkey` FOREIGN KEY (`speciesId`) REFERENCES `species`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_varietyId_fkey` FOREIGN KEY (`varietyId`) REFERENCES `varieties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_processingMethodId_fkey` FOREIGN KEY (`processingMethodId`) REFERENCES `processing_methods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `coffee_grades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coffee_beans` ADD CONSTRAINT `coffee_beans_harvestSeasonId_fkey` FOREIGN KEY (`harvestSeasonId`) REFERENCES `harvest_seasons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farms` ADD CONSTRAINT `farms_farmerId_fkey` FOREIGN KEY (`farmerId`) REFERENCES `farmers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmers` ADD CONSTRAINT `farmers_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `regions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmers` ADD CONSTRAINT `farmers_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `regions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regions` ADD CONSTRAINT `regions_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sensory_profile_flavors` ADD CONSTRAINT `sensory_profile_flavors_sensoryProfileId_fkey` FOREIGN KEY (`sensoryProfileId`) REFERENCES `sensory_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sensory_profile_flavors` ADD CONSTRAINT `sensory_profile_flavors_flavorProfileId_fkey` FOREIGN KEY (`flavorProfileId`) REFERENCES `flavor_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sensory_profiles` ADD CONSTRAINT `sensory_profiles_coffeeBeanId_fkey` FOREIGN KEY (`coffeeBeanId`) REFERENCES `coffee_beans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `varieties` ADD CONSTRAINT `varieties_speciesId_fkey` FOREIGN KEY (`speciesId`) REFERENCES `species`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
