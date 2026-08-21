-- Add query-path indexes while remaining safe for databases that already contain them.
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'coffee_beans' AND index_name = 'coffee_beans_varietyId_idx') = 0,
  'CREATE INDEX `coffee_beans_varietyId_idx` ON `coffee_beans`(`varietyId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'coffee_beans' AND index_name = 'coffee_beans_processingMethodId_idx') = 0,
  'CREATE INDEX `coffee_beans_processingMethodId_idx` ON `coffee_beans`(`processingMethodId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'coffee_beans' AND index_name = 'coffee_beans_gradeId_idx') = 0,
  'CREATE INDEX `coffee_beans_gradeId_idx` ON `coffee_beans`(`gradeId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
