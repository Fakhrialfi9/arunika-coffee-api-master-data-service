-- Step 29 + Step 30 database validation.
-- Run against the target arunika_coffee_master_data database.
-- This script is read-only.

SELECT 'STEP 29 - TABLES' AS section;
SELECT TABLE_NAME, TABLE_TYPE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

SELECT 'STEP 29 - COLUMNS / NULLABILITY / DEFAULTS' AS section;
SELECT TABLE_NAME, ORDINAL_POSITION, COLUMN_NAME, COLUMN_TYPE,
       IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, ORDINAL_POSITION;

SELECT 'STEP 29 - PRIMARY / UNIQUE / INDEX METADATA' AS section;
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME,
       INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

SELECT 'STEP 29 - FOREIGN KEYS' AS section;
SELECT kcu.CONSTRAINT_NAME,
       kcu.TABLE_NAME AS child_table,
       kcu.COLUMN_NAME AS child_column,
       kcu.REFERENCED_TABLE_NAME AS parent_table,
       kcu.REFERENCED_COLUMN_NAME AS parent_column,
       rc.UPDATE_RULE,
       rc.DELETE_RULE
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
 AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
 AND rc.TABLE_NAME = kcu.TABLE_NAME
WHERE kcu.CONSTRAINT_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION;

SELECT 'STEP 30 - EXPECTED FK COUNT' AS section;
SELECT COUNT(*) AS actual_fk_count
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL;

SELECT 'STEP 30 - ORPHAN CHECKS' AS section;
SELECT 'regions -> countries' AS check_name, COUNT(*) AS orphan_count
FROM regions r LEFT JOIN countries c ON c.id = r.countryId WHERE c.id IS NULL
UNION ALL
SELECT 'organizations -> regions', COUNT(*)
FROM organizations o LEFT JOIN regions r ON r.id = o.regionId WHERE r.id IS NULL
UNION ALL
SELECT 'farmers -> regions', COUNT(*)
FROM farmers f LEFT JOIN regions r ON r.id = f.regionId WHERE r.id IS NULL
UNION ALL
SELECT 'farmers -> organizations (nullable)', COUNT(*)
FROM farmers f LEFT JOIN organizations o ON o.id = f.organizationId
WHERE f.organizationId IS NOT NULL AND o.id IS NULL
UNION ALL
SELECT 'farms -> farmers', COUNT(*)
FROM farms f LEFT JOIN farmers fr ON fr.id = f.farmerId WHERE fr.id IS NULL
UNION ALL
SELECT 'coffee_beans -> regions', COUNT(*)
FROM coffee_beans cb LEFT JOIN regions r ON r.id = cb.regionId WHERE r.id IS NULL
UNION ALL
SELECT 'coffee_beans -> farmers (nullable)', COUNT(*)
FROM coffee_beans cb LEFT JOIN farmers f ON f.id = cb.farmerId
WHERE cb.farmerId IS NOT NULL AND f.id IS NULL
UNION ALL
SELECT 'coffee_beans -> farms (nullable)', COUNT(*)
FROM coffee_beans cb LEFT JOIN farms f ON f.id = cb.farmId
WHERE cb.farmId IS NOT NULL AND f.id IS NULL
UNION ALL
SELECT 'coffee_beans -> species', COUNT(*)
FROM coffee_beans cb LEFT JOIN species s ON s.id = cb.speciesId WHERE s.id IS NULL
UNION ALL
SELECT 'coffee_beans -> varieties (nullable)', COUNT(*)
FROM coffee_beans cb LEFT JOIN varieties v ON v.id = cb.varietyId
WHERE cb.varietyId IS NOT NULL AND v.id IS NULL
UNION ALL
SELECT 'coffee_beans -> processing_methods', COUNT(*)
FROM coffee_beans cb LEFT JOIN processing_methods pm ON pm.id = cb.processingMethodId WHERE pm.id IS NULL
UNION ALL
SELECT 'coffee_beans -> coffee_grades (nullable)', COUNT(*)
FROM coffee_beans cb LEFT JOIN coffee_grades cg ON cg.id = cb.gradeId
WHERE cb.gradeId IS NOT NULL AND cg.id IS NULL
UNION ALL
SELECT 'coffee_beans -> harvest_seasons (nullable)', COUNT(*)
FROM coffee_beans cb LEFT JOIN harvest_seasons hs ON hs.id = cb.harvestSeasonId
WHERE cb.harvestSeasonId IS NOT NULL AND hs.id IS NULL
UNION ALL
SELECT 'varieties -> species', COUNT(*)
FROM varieties v LEFT JOIN species s ON s.id = v.speciesId WHERE s.id IS NULL
UNION ALL
SELECT 'sensory_profiles -> coffee_beans', COUNT(*)
FROM sensory_profiles sp LEFT JOIN coffee_beans cb ON cb.id = sp.coffeeBeanId WHERE cb.id IS NULL
UNION ALL
SELECT 'sensory_profile_flavors -> sensory_profiles', COUNT(*)
FROM sensory_profile_flavors spf LEFT JOIN sensory_profiles sp ON sp.id = spf.sensoryProfileId WHERE sp.id IS NULL
UNION ALL
SELECT 'sensory_profile_flavors -> flavor_profiles', COUNT(*)
FROM sensory_profile_flavors spf LEFT JOIN flavor_profiles fp ON fp.id = spf.flavorProfileId WHERE fp.id IS NULL;

SELECT 'STEP 30 - RELATION CARDINALITY / OPTIONALITY' AS section;
SELECT 'sensory_profiles.coffeeBeanId unique = 1:0..1' AS contract_check,
       COUNT(*) AS duplicate_fk_values
FROM (
    SELECT coffeeBeanId
    FROM sensory_profiles
    GROUP BY coffeeBeanId
    HAVING COUNT(*) > 1
) duplicates;

SELECT 'sensory_profile_flavors pair unique = no duplicate pairs' AS contract_check,
       COUNT(*) AS duplicate_pair_count
FROM (
    SELECT sensoryProfileId, flavorProfileId
    FROM sensory_profile_flavors
    GROUP BY sensoryProfileId, flavorProfileId
    HAVING COUNT(*) > 1
) duplicates;

SELECT 'STEP 30 - FK RULES' AS section;
SELECT kcu.CONSTRAINT_NAME,
       kcu.TABLE_NAME AS child_table,
       kcu.COLUMN_NAME AS child_column,
       kcu.REFERENCED_TABLE_NAME AS parent_table,
       kcu.REFERENCED_COLUMN_NAME AS parent_column,
       rc.DELETE_RULE AS on_delete,
       rc.UPDATE_RULE AS on_update
FROM information_schema.KEY_COLUMN_USAGE kcu
JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
  ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
 AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
 AND rc.TABLE_NAME = kcu.TABLE_NAME
WHERE kcu.CONSTRAINT_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY child_table, kcu.CONSTRAINT_NAME;

SELECT 'STEP 29/30 - DATABASE NAME' AS section, DATABASE() AS database_name;
