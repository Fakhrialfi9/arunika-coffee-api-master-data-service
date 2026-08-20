-- Step 41-45 database validation.
-- Read-only checks for arunika_coffee_master_data.
-- These checks do not modify schema or data.

SELECT 'STEP 41 - PROCESSING / QUALITY FK METADATA' AS section;
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
  AND kcu.TABLE_NAME = 'coffee_beans'
  AND kcu.COLUMN_NAME IN ('processingMethodId', 'gradeId')
ORDER BY kcu.COLUMN_NAME;

SELECT 'STEP 41 - PROCESSING / QUALITY NULLABILITY' AS section;
SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'coffee_beans'
  AND COLUMN_NAME IN ('processingMethodId', 'gradeId');

SELECT 'STEP 41 - ORPHAN PROCESSING / GRADE REFERENCES' AS section;
SELECT 'coffee_beans -> processing_methods' AS check_name, COUNT(*) AS orphan_count
FROM coffee_beans cb
LEFT JOIN processing_methods pm ON pm.id = cb.processingMethodId
WHERE pm.id IS NULL
UNION ALL
SELECT 'coffee_beans -> coffee_grades (nullable)', COUNT(*)
FROM coffee_beans cb
LEFT JOIN coffee_grades cg ON cg.id = cb.gradeId
WHERE cb.gradeId IS NOT NULL AND cg.id IS NULL;

SELECT 'STEP 41 - ACTIVE / INACTIVE DEPENDENCY SEMANTICS' AS section;
SELECT 'processing method inactive references' AS check_name, COUNT(*) AS reference_count
FROM coffee_beans cb
JOIN processing_methods pm ON pm.id = cb.processingMethodId
WHERE pm.isActive = 0
UNION ALL
SELECT 'coffee grade inactive references', COUNT(*)
FROM coffee_beans cb
JOIN coffee_grades cg ON cg.id = cb.gradeId
WHERE cg.isActive = 0;

SELECT 'STEP 42 - HARVEST SEASON CONTRACT' AS section;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'harvest_seasons'
ORDER BY ORDINAL_POSITION;

SELECT 'STEP 42 - HARVEST SEASON UNIQUES / INDEXES' AS section;
SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'harvest_seasons'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

SELECT 'STEP 42/43 - HARVEST SEASON REFERENCE' AS section;
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
  AND kcu.TABLE_NAME = 'coffee_beans'
  AND kcu.COLUMN_NAME = 'harvestSeasonId';

SELECT 'STEP 43 - HARVEST SEASON ORPHANS' AS section;
SELECT 'coffee_beans -> harvest_seasons (nullable)' AS check_name,
       COUNT(*) AS orphan_count
FROM coffee_beans cb
LEFT JOIN harvest_seasons hs ON hs.id = cb.harvestSeasonId
WHERE cb.harvestSeasonId IS NOT NULL AND hs.id IS NULL;

SELECT 'STEP 43 - YEAR / MONTH INTEGRITY' AS section;
SELECT
  SUM(year < 1 OR year > 9999) AS invalid_year_count,
  SUM(startMonth IS NOT NULL AND (startMonth < 1 OR startMonth > 12)) AS invalid_start_month_count,
  SUM(endMonth IS NOT NULL AND (endMonth < 1 OR endMonth > 12)) AS invalid_end_month_count,
  SUM(startMonth IS NOT NULL AND endMonth IS NOT NULL AND startMonth > endMonth) AS reversed_month_range_count,
  SUM((startMonth IS NULL) <> (endMonth IS NULL)) AS partial_month_range_count
FROM harvest_seasons;

SELECT 'STEP 43 - CURRENT SEASON INTEGRITY' AS section;
SELECT
  SUM(isCurrent = 1) AS current_count,
  SUM(isCurrent = 1 AND isActive = 0) AS inactive_current_count
FROM harvest_seasons;

SELECT 'STEP 43 - CURRENT SEASON DUPLICATES' AS section;
SELECT isCurrent, COUNT(*) AS row_count
FROM harvest_seasons
WHERE isCurrent = 1
GROUP BY isCurrent;

SELECT 'STEP 44 - CERTIFICATION CONTRACT' AS section;
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'certifications'
ORDER BY ORDINAL_POSITION;

SELECT 'STEP 44 - CERTIFICATION UNIQUES' AS section;
SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'certifications'
  AND NON_UNIQUE = 0
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

SELECT 'STEP 45 - CERTIFICATION FK BOUNDARY' AS section;
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
  AND (kcu.TABLE_NAME = 'certifications' OR kcu.REFERENCED_TABLE_NAME = 'certifications')
ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME;

SELECT 'STEP 45 - EXPLICIT CERTIFICATION COLUMNS' AS section;
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND LOWER(COLUMN_NAME) LIKE '%certif%'
ORDER BY TABLE_NAME, COLUMN_NAME;

SELECT 'STEP 45 - JSON COLUMNS IN RELEVANT ENTITIES' AS section;
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND DATA_TYPE = 'json'
  AND TABLE_NAME IN (
    'coffee_beans',
    'farmers',
    'farms',
    'organizations',
    'regions',
    'countries'
  )
ORDER BY TABLE_NAME, COLUMN_NAME;

SELECT 'STEP 45 - DATABASE NAME' AS section, DATABASE() AS database_name;
