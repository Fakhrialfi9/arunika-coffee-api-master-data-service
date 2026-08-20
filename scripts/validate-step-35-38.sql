-- Step 35 + Step 38 runtime relationship validation.
-- Run against arunika_coffee_master_data.
-- Read-only: no INSERT / UPDATE / DELETE / DDL is performed.

SELECT 'DATABASE' AS section, DATABASE() AS database_name;

SELECT 'STEP 35 - SUPPLY CHAIN ORPHANS' AS section;
SELECT 'regions -> countries' AS check_name, COUNT(*) AS invalid_count
FROM regions r
LEFT JOIN countries c ON c.id = r.countryId
WHERE c.id IS NULL
UNION ALL
SELECT 'organizations -> regions', COUNT(*)
FROM organizations o
LEFT JOIN regions r ON r.id = o.regionId
WHERE r.id IS NULL
UNION ALL
SELECT 'farmers -> regions', COUNT(*)
FROM farmers f
LEFT JOIN regions r ON r.id = f.regionId
WHERE r.id IS NULL
UNION ALL
SELECT 'farmers -> organizations (nullable)', COUNT(*)
FROM farmers f
LEFT JOIN organizations o ON o.id = f.organizationId
WHERE f.organizationId IS NOT NULL AND o.id IS NULL
UNION ALL
SELECT 'farms -> farmers', COUNT(*)
FROM farms f
LEFT JOIN farmers fr ON fr.id = f.farmerId
WHERE fr.id IS NULL;

SELECT 'STEP 35 - FARMER / ORGANIZATION REGIONAL CONSISTENCY' AS section;
SELECT 'farmer.regionId != organization.regionId' AS check_name,
       COUNT(*) AS invalid_count
FROM farmers f
JOIN organizations o ON o.id = f.organizationId
WHERE f.organizationId IS NOT NULL
  AND f.regionId <> o.regionId;

SELECT 'STEP 35 - GRAPH COUNTS' AS section;
SELECT
  (SELECT COUNT(*) FROM countries) AS countries_count,
  (SELECT COUNT(*) FROM regions) AS regions_count,
  (SELECT COUNT(*) FROM organizations) AS organizations_count,
  (SELECT COUNT(*) FROM farmers) AS farmers_count,
  (SELECT COUNT(*) FROM farms) AS farms_count;

SELECT 'STEP 36 - SPECIES CONTRACT' AS section;
SELECT
  (SELECT COUNT(*) FROM species) AS species_count,
  (SELECT COUNT(*) FROM species WHERE isActive = 1) AS active_species_count,
  (SELECT COUNT(*) FROM (
      SELECT uuid FROM species GROUP BY uuid HAVING COUNT(*) > 1
   ) duplicates) AS duplicate_uuid_count,
  (SELECT COUNT(*) FROM (
      SELECT code FROM species GROUP BY code HAVING COUNT(*) > 1
   ) duplicates) AS duplicate_code_count;

SELECT 'STEP 37 - VARIETY CONTRACT' AS section;
SELECT
  (SELECT COUNT(*) FROM varieties) AS varieties_count,
  (SELECT COUNT(*) FROM varieties WHERE isActive = 1) AS active_varieties_count,
  (SELECT COUNT(*) FROM (
      SELECT uuid FROM varieties GROUP BY uuid HAVING COUNT(*) > 1
   ) duplicates) AS duplicate_uuid_count,
  (SELECT COUNT(*) FROM (
      SELECT code FROM varieties GROUP BY code HAVING COUNT(*) > 1
   ) duplicates) AS duplicate_code_count;

SELECT 'STEP 37 - VARIETY -> SPECIES ORPHANS' AS section;
SELECT 'varieties -> species' AS check_name, COUNT(*) AS invalid_count
FROM varieties v
LEFT JOIN species s ON s.id = v.speciesId
WHERE s.id IS NULL;

SELECT 'STEP 38 - TAXONOMY ORPHANS' AS section;
SELECT 'coffee_beans -> species' AS check_name, COUNT(*) AS invalid_count
FROM coffee_beans cb
LEFT JOIN species s ON s.id = cb.speciesId
WHERE s.id IS NULL
UNION ALL
SELECT 'coffee_beans -> varieties (nullable)', COUNT(*)
FROM coffee_beans cb
LEFT JOIN varieties v ON v.id = cb.varietyId
WHERE cb.varietyId IS NOT NULL AND v.id IS NULL;

SELECT 'STEP 38 - SPECIES / VARIETY MISMATCH' AS section;
SELECT
  cb.id AS coffee_bean_id,
  cb.code AS coffee_bean_code,
  cb.speciesId AS coffee_bean_species_id,
  cb.varietyId AS coffee_bean_variety_id,
  v.speciesId AS variety_species_id
FROM coffee_beans cb
JOIN varieties v ON v.id = cb.varietyId
WHERE cb.varietyId IS NOT NULL
  AND cb.speciesId <> v.speciesId
ORDER BY cb.id;

SELECT 'STEP 38 - SPECIES / VARIETY MISMATCH COUNT' AS section;
SELECT COUNT(*) AS mismatch_count
FROM coffee_beans cb
JOIN varieties v ON v.id = cb.varietyId
WHERE cb.varietyId IS NOT NULL
  AND cb.speciesId <> v.speciesId;

SELECT 'STEP 38 - ACTIVE TAXONOMY AUDIT' AS section;
SELECT
  'active coffee bean with inactive species' AS check_name,
  COUNT(*) AS row_count
FROM coffee_beans cb
JOIN species s ON s.id = cb.speciesId
WHERE cb.isActive = 1 AND s.isActive = 0
UNION ALL
SELECT
  'active coffee bean with inactive variety' AS check_name,
  COUNT(*)
FROM coffee_beans cb
JOIN varieties v ON v.id = cb.varietyId
WHERE cb.isActive = 1
  AND cb.varietyId IS NOT NULL
  AND v.isActive = 0;

SELECT 'STEP 38 - FK RULES' AS section;
SELECT
  kcu.CONSTRAINT_NAME,
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
  AND (
    (kcu.TABLE_NAME = 'regions' AND kcu.COLUMN_NAME = 'countryId')
    OR (kcu.TABLE_NAME = 'organizations' AND kcu.COLUMN_NAME = 'regionId')
    OR (kcu.TABLE_NAME = 'farmers' AND kcu.COLUMN_NAME IN ('regionId', 'organizationId'))
    OR (kcu.TABLE_NAME = 'farms' AND kcu.COLUMN_NAME = 'farmerId')
    OR (kcu.TABLE_NAME = 'varieties' AND kcu.COLUMN_NAME = 'speciesId')
    OR (kcu.TABLE_NAME = 'coffee_beans' AND kcu.COLUMN_NAME IN ('speciesId', 'varietyId'))
  )
ORDER BY child_table, child_column;
