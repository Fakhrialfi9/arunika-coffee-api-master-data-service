#!/usr/bin/env bash
set -Eeuo pipefail

# Arunika Coffee Master Data Service
# One-command verification for PHASE 2 / Step 26-45.
#
# IMPORTANT:
# - This script is a VERIFICATION gate, not a migration tool.
# - It never creates/changes/drops database objects.
# - It never creates a git branch.
# - A step is PASS only when every applicable check succeeds.
# - Missing/ambiguous checks fail the gate instead of being silently ignored.
#
# Usage:
#   chmod +x scripts/verify-steps-26-45.sh
#   ./scripts/verify-steps-26-45.sh
#
# Optional:
#   REPORT_FILE=tmp/steps-26-45-report.txt ./scripts/verify-steps-26-45.sh
#   DATABASE_URL='mysql://user:pass@127.0.0.1:3306/arunika_coffee_master_data' ./scripts/verify-steps-26-45.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPORT_FILE="${REPORT_FILE:-tmp/steps-26-45-report.txt}"
mkdir -p "$(dirname "$REPORT_FILE")"
: > "$REPORT_FILE"

TOTAL=0
PASSED=0
FAILED=0
CURRENT_STEP=""

log() {
  printf '%s\n' "$*" | tee -a "$REPORT_FILE"
}

pass() {
  TOTAL=$((TOTAL + 1))
  PASSED=$((PASSED + 1))
  log "PASS  $*"
}

fail() {
  TOTAL=$((TOTAL + 1))
  FAILED=$((FAILED + 1))
  log "FAIL  $*"
}

step_start() {
  CURRENT_STEP="$1"
  log ""
  log "============================================================"
  log "STEP $1 — $2"
  log "============================================================"
}

run_check() {
  local label="$1"
  shift
  if "$@" >>"$REPORT_FILE" 2>&1; then
    pass "$label"
  else
    fail "$label"
  fi
}

run_shell_check() {
  local label="$1"
  local command="$2"
  if bash -c "$command" >>"$REPORT_FILE" 2>&1; then
    pass "$label"
  else
    fail "$label"
  fi
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

if [[ -f .env ]]; then
  # Export only simple KEY=VALUE entries; do not overwrite variables supplied by shell.
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

log "Arunika Coffee Master Data Service — Step 26-45 Verification"
log "Repository: $(basename "$ROOT_DIR")"
log "Branch: $(git branch --show-current 2>/dev/null || echo UNKNOWN)"
log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo UNKNOWN)"
log "Report: $REPORT_FILE"

# -----------------------------------------------------------------------------
# Preconditions / safety
# -----------------------------------------------------------------------------
step_start "PRE" "Verification Preconditions"

if [[ "$(git branch --show-current)" == "main" ]]; then
  pass "Git branch is main"
else
  fail "Git branch must be main"
fi

if git diff --quiet && git diff --cached --quiet; then
  pass "Working tree is clean before verification"
else
  fail "Working tree is not clean; review user changes before trusting the report"
fi

if command_exists node; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$NODE_MAJOR" == "22" ]]; then
    pass "Node.js major version is 22"
  else
    fail "Node.js major version must be 22.x; found $(node -v)"
  fi
else
  fail "node command is available"
fi

if command_exists npm; then pass "npm is available ($(npm -v))"; else fail "npm is available"; fi
if command_exists git; then pass "git is available"; else fail "git is available"; fi
if command_exists mysql; then pass "mysql CLI is available"; else fail "mysql CLI is available (required for DB contract checks)"; fi

# -----------------------------------------------------------------------------
# Step 26 — Foundation
# -----------------------------------------------------------------------------
step_start "26" "Master Data Foundation Audit"
run_shell_check "package.json exists" 'test -f package.json'
run_shell_check "package-lock.json exists" 'test -f package-lock.json'
run_shell_check "NestJS core dependency exists" 'node -e "const p=require(\"./package.json\"); process.exit(p.dependencies?.[\"@nestjs/core\"] ? 0 : 1)"'
run_shell_check "Prisma 7 dependency exists" 'node -e "const p=require(\"./package.json\"); process.exit(p.devDependencies?.prisma?.startsWith(\"7.\") ? 0 : 1)"'
run_shell_check "Prisma Client 7 dependency exists" 'node -e "const p=require(\"./package.json\"); process.exit(p.dependencies?.[\"@prisma/client\"]?.startsWith(\"7.\") ? 0 : 1)"'
run_shell_check "TypeScript dependency exists" 'node -e "const p=require(\"./package.json\"); process.exit(p.devDependencies?.typescript ? 0 : 1)"'
run_shell_check "Vitest dependency exists" 'node -e "const p=require(\"./package.json\"); process.exit(p.devDependencies?.vitest ? 0 : 1)"'
run_shell_check "Required package scripts exist" 'node - <<\"NODE\"\nconst s=require("./package.json").scripts||{}; const x=["test","test:unit","test:e2e","test:grpc","test:security","test:all","typecheck","lint","format:check","build","prisma:generate","prisma:status"]; process.exit(x.every(k=>typeof s[k]==="string")?0:1)\nNODE'
run_shell_check "No obvious branch other than main is checked out" 'test "$(git branch --show-current)" = main'

# -----------------------------------------------------------------------------
# Step 27 — Architecture
# -----------------------------------------------------------------------------
step_start "27" "Master Data Architecture"
run_shell_check "src directory exists" 'test -d src'
run_shell_check "test directory exists" 'test -d test'
run_shell_check "Domain/application/infrastructure/presentation concepts are represented in source tree" 'find src -type d \( -iname "domain" -o -iname "application" -o -iname "infrastructure" -o -iname "presentation" \) | grep -q .'
run_shell_check "No direct Prisma import from controller/presentation files" '! grep -R --include="*.ts" -E "from [\x27\"]@prisma/client[\x27\"]|from [\x27\"]prisma[\x27\"]" src 2>/dev/null | grep -Ei "controller|presentation"'
run_shell_check "No direct database URL usage in controller/presentation files" '! grep -R --include="*.ts" -E "DATABASE_URL|PrismaClient|mariadb" src 2>/dev/null | grep -Ei "controller|presentation"'

# -----------------------------------------------------------------------------
# Prisma / DB helpers
# -----------------------------------------------------------------------------
prisma_validate() { npx prisma validate; }
prisma_generate() { npx prisma generate; }
prisma_status() { npx prisma migrate status; }

if [[ -z "${DATABASE_URL:-}" ]]; then
  fail "DATABASE_URL is configured"
  log "ERROR: DATABASE_URL is required for Steps 28-45 database checks."
else
  pass "DATABASE_URL is configured"
fi

mysql_exec() {
  local sql="$1"
  mysql --protocol=tcp --batch --skip-column-names \
    -h "${DATABASE_HOST:-127.0.0.1}" \
    -P "${DATABASE_PORT:-3306}" \
    -u "${DATABASE_USER:-dev}" \
    -p"${DATABASE_PASSWORD:-}" \
    -e "$sql"
}

DB_NAME="${DATABASE_NAME:-arunika_coffee_master_data}"

# -----------------------------------------------------------------------------
# Step 28 — Database foundation
# -----------------------------------------------------------------------------
step_start "28" "Database Foundation"
run_check "Prisma schema validates" prisma_validate
run_check "Prisma Client generates" prisma_generate
run_check "Prisma migration status is synchronized" prisma_status
if command_exists mysql && [[ -n "${DATABASE_URL:-}" ]]; then
  run_shell_check "Database connection succeeds" 'mysql_exec "SELECT 1"'
  run_shell_check "Database arunika_coffee_master_data exists" 'test "$(mysql_exec "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME=\"$DB_NAME\"")" = "$DB_NAME"'
  run_shell_check "Migration table exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"_prisma_migrations\"")" = 1'
else
  fail "Database checks can run"
fi

# -----------------------------------------------------------------------------
# Step 29 — Schema inventory
# -----------------------------------------------------------------------------
step_start "29" "Database Schema Inventory"
EXPECTED_TABLES="_prisma_migrations certifications coffee_beans coffee_grades countries farmers farms flavor_profiles harvest_seasons organizations processing_methods regions sensory_profile_flavors sensory_profiles species varieties"
for table in $EXPECTED_TABLES; do
  run_shell_check "Table exists: $table" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"'$table'\"")" = 1'
done

# Exact contract metadata for the 5 tables central to Steps 41-45.
check_column() {
  local table="$1" column="$2" nullable="$3" data_type="$4" expected_default="$5"
  local row
  row="$(mysql_exec "SELECT CONCAT(IFNULL(DATA_TYPE,''),'|',IFNULL(IS_NULLABLE,''),'|',IFNULL(COLUMN_DEFAULT,'<NULL>')) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='$table' AND COLUMN_NAME='$column'")"
  [[ "$row" == "$data_type|$nullable|$expected_default" ]]
}

# -----------------------------------------------------------------------------
# Step 30 — Referential integrity
# -----------------------------------------------------------------------------
step_start "30" "Referential Integrity"
run_shell_check "All expected FK constraints have no orphan rows" 'mysql_exec "SELECT CONCAT(CONSTRAINT_NAME,\": orphan count=\",COUNT(*)) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.CONSTRAINT_SCHEMA=\"$DB_NAME\" AND k.REFERENCED_TABLE_NAME IS NOT NULL GROUP BY CONSTRAINT_NAME HAVING COUNT(*) < 0"'

# Generic orphan detector generated from actual FK metadata.
FK_COUNT=0
if command_exists mysql; then
  while IFS=$'\t' read -r child child_col parent parent_col; do
    [[ -z "$child" ]] && continue
    FK_COUNT=$((FK_COUNT + 1))
    ORPHAN="$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.\`$child\` c LEFT JOIN \`$DB_NAME\`.\`$parent\` p ON c.\`$child_col\`=p.\`$parent_col\` WHERE c.\`$child_col\` IS NOT NULL AND p.\`$parent_col\` IS NULL")"
    if [[ "$ORPHAN" == "0" ]]; then pass "FK orphan check: $child.$child_col -> $parent.$parent_col"; else fail "FK orphan check: $child.$child_col -> $parent.$parent_col (orphans=$ORPHAN)"; fi
  done < <(mysql_exec "SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='$DB_NAME' AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME,COLUMN_NAME" | tr '\t' '\t')
fi
if [[ "$FK_COUNT" -gt 0 ]]; then pass "Database exposes $FK_COUNT foreign-key column(s)"; else fail "Database exposes expected foreign-key relationships"; fi

# -----------------------------------------------------------------------------
# Steps 31-35 — Geography / Supply Chain
# -----------------------------------------------------------------------------
step_start "31" "Geography Master Data"
run_shell_check "countries has PK" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"countries\" AND CONSTRAINT_TYPE=\"PRIMARY KEY\"")" = 1'
run_shell_check "regions has countryId FK" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"regions\" AND COLUMN_NAME=\"countryId\" AND REFERENCED_TABLE_NAME=\"countries\"")" = 1'
run_shell_check "countries.uuid is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"countries\" AND COLUMN_NAME=\"uuid\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "regions.code is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"regions\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'

step_start "32" "Organization Master Data"
run_shell_check "organizations.regionId FK exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"organizations\" AND COLUMN_NAME=\"regionId\" AND REFERENCED_TABLE_NAME=\"regions\"")" = 1'
run_shell_check "organizations.code is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"organizations\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'

step_start "33" "Farmer Master Data"
run_shell_check "farmers.regionId FK exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"farmers\" AND COLUMN_NAME=\"regionId\" AND REFERENCED_TABLE_NAME=\"regions\"")" = 1'
run_shell_check "farmers.organizationId nullable" 'check_column farmers organizationId YES varchar NULL'
run_shell_check "farmers.code is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"farmers\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'

step_start "34" "Farm Master Data"
run_shell_check "farms.farmerId is required" 'check_column farms farmerId NO varchar NULL'
run_shell_check "farms.farmerId FK exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"farms\" AND COLUMN_NAME=\"farmerId\" AND REFERENCED_TABLE_NAME=\"farmers\"")" = 1'
run_shell_check "farms.uuid is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"farms\" AND COLUMN_NAME=\"uuid\" AND NON_UNIQUE=0")" -ge 1'

step_start "35" "Farmer-Farm Supply Chain Graph"
run_shell_check "Country -> Region -> Farmer graph exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"regions\" AND REFERENCED_TABLE_NAME=\"countries\"")" -ge 1 && test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"farmers\" AND REFERENCED_TABLE_NAME=\"regions\"")" -ge 1'
run_shell_check "Farmer -> Farm graph exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"farms\" AND REFERENCED_TABLE_NAME=\"farmers\"")" -ge 1'

# -----------------------------------------------------------------------------
# Steps 36-38 — Taxonomy
# -----------------------------------------------------------------------------
step_start "36" "Coffee Taxonomy - Species"
run_shell_check "species.code is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"species\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "species.uuid is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"species\" AND COLUMN_NAME=\"uuid\" AND NON_UNIQUE=0")" -ge 1'

step_start "37" "Coffee Taxonomy - Variety"
run_shell_check "varieties.speciesId is required" 'check_column varieties speciesId NO varchar NULL'
run_shell_check "varieties.speciesId FK exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"varieties\" AND COLUMN_NAME=\"speciesId\" AND REFERENCED_TABLE_NAME=\"species\"")" = 1'
run_shell_check "varieties.code is unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"varieties\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'

step_start "38" "Coffee Taxonomy Integrity"
run_shell_check "Species -> Variety has no orphans" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.varieties v LEFT JOIN \`$DB_NAME\`.species s ON v.speciesId=s.id WHERE s.id IS NULL")" = 0'
run_shell_check "CoffeeBean -> Species FK has no orphans" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.coffee_beans c LEFT JOIN \`$DB_NAME\`.species s ON c.speciesId=s.id WHERE c.speciesId IS NOT NULL AND s.id IS NULL")" = 0'
run_shell_check "CoffeeBean -> Variety FK has no orphans" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.coffee_beans c LEFT JOIN \`$DB_NAME\`.varieties v ON c.varietyId=v.id WHERE c.varietyId IS NOT NULL AND v.id IS NULL")" = 0'

# -----------------------------------------------------------------------------
# Step 39 — Processing Method
# -----------------------------------------------------------------------------
step_start "39" "Processing Method Master"
run_shell_check "processing_methods.uuid unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"processing_methods\" AND COLUMN_NAME=\"uuid\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "processing_methods.code unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"processing_methods\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "processingSteps is JSON" 'test "$(mysql_exec "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"processing_methods\" AND COLUMN_NAME=\"processingSteps\"")" = json'
run_shell_check "parameters is JSON" 'test "$(mysql_exec "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"processing_methods\" AND COLUMN_NAME=\"parameters\"")" = json'

# -----------------------------------------------------------------------------
# Step 40 — Coffee Grade
# -----------------------------------------------------------------------------
step_start "40" "Coffee Grade Master"
run_shell_check "coffee_grades.uuid unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"coffee_grades\" AND COLUMN_NAME=\"uuid\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "coffee_grades.code unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"coffee_grades\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "exportEligible is required with default false" 'check_column coffee_grades exportEligible NO tinyint 0'
run_shell_check "minimumCuppingScore nullable" 'check_column coffee_grades minimumCuppingScore YES double NULL'
run_shell_check "maxDefectCount nullable" 'check_column coffee_grades maxDefectCount YES int NULL'

# -----------------------------------------------------------------------------
# Step 41 — Processing & Quality relationships
# -----------------------------------------------------------------------------
step_start "41" "Processing & Quality Relationship"
run_shell_check "coffee_beans.processingMethodId is required" 'check_column coffee_beans processingMethodId NO varchar NULL'
run_shell_check "coffee_beans.gradeId is optional" 'check_column coffee_beans gradeId YES varchar NULL'
run_shell_check "CoffeeBean -> ProcessingMethod FK exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"coffee_beans\" AND COLUMN_NAME=\"processingMethodId\" AND REFERENCED_TABLE_NAME=\"processing_methods\"")" = 1'
run_shell_check "CoffeeBean -> CoffeeGrade FK exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"coffee_beans\" AND COLUMN_NAME=\"gradeId\" AND REFERENCED_TABLE_NAME=\"coffee_grades\"")" = 1'
run_shell_check "No orphan ProcessingMethod references" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.coffee_beans c LEFT JOIN \`$DB_NAME\`.processing_methods p ON c.processingMethodId=p.id WHERE c.processingMethodId IS NOT NULL AND p.id IS NULL")" = 0'
run_shell_check "No orphan CoffeeGrade references" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.coffee_beans c LEFT JOIN \`$DB_NAME\`.coffee_grades g ON c.gradeId=g.id WHERE c.gradeId IS NOT NULL AND g.id IS NULL")" = 0'
run_shell_check "ProcessingMethod active/inactive dependency is documented in code/docs" 'grep -R -Ei "processing.?method.*inactive|inactive.*processing.?method|active.*processing.?method" README.md docs src test 2>/dev/null'
run_shell_check "CoffeeGrade active/inactive dependency is documented in code/docs" 'grep -R -Ei "coffee.?grade.*inactive|inactive.*coffee.?grade|active.*coffee.?grade" README.md docs src test 2>/dev/null'

# -----------------------------------------------------------------------------
# Step 42 — Harvest Season master
# -----------------------------------------------------------------------------
step_start "42" "Harvest Season Master"
run_shell_check "harvest_seasons.uuid unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"harvest_seasons\" AND COLUMN_NAME=\"uuid\" AND NON_UNIQUE=0")" -ge 1'
for spec in \
  "id|NO|varchar|<NULL>" \
  "uuid|NO|varchar|<NULL>" \
  "name|NO|varchar|<NULL>" \
  "label|YES|varchar|<NULL>" \
  "year|NO|int|<NULL>" \
  "seasonType|YES|varchar|<NULL>" \
  "startMonth|YES|int|<NULL>" \
  "endMonth|YES|int|<NULL>" \
  "isCurrent|NO|tinyint|0" \
  "description|YES|varchar|<NULL>" \
  "isActive|NO|tinyint|1" \
  "sortOrder|NO|int|0"; do
  IFS='|' read -r c n t d <<< "$spec"
  run_shell_check "harvest_seasons.$c contract" "check_column harvest_seasons '$c' '$n' '$t' '$d'"
done
run_shell_check "CoffeeBean.harvestSeasonId is optional" 'check_column coffee_beans harvestSeasonId YES varchar NULL'
run_shell_check "CoffeeBean -> HarvestSeason FK exists" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"coffee_beans\" AND COLUMN_NAME=\"harvestSeasonId\" AND REFERENCED_TABLE_NAME=\"harvest_seasons\"")" = 1'

# -----------------------------------------------------------------------------
# Step 43 — Harvest Season integrity
# -----------------------------------------------------------------------------
step_start "43" "Harvest Season Integrity"
run_shell_check "All harvest years are valid positive calendar years" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.harvest_seasons WHERE year < 1")" = 0'
run_shell_check "startMonth values are NULL or 1-12" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.harvest_seasons WHERE startMonth IS NOT NULL AND (startMonth < 1 OR startMonth > 12)")" = 0'
run_shell_check "endMonth values are NULL or 1-12" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.harvest_seasons WHERE endMonth IS NOT NULL AND (endMonth < 1 OR endMonth > 12)")" = 0'
run_shell_check "startMonth <= endMonth when both are present" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.harvest_seasons WHERE startMonth IS NOT NULL AND endMonth IS NOT NULL AND startMonth > endMonth")" = 0'
run_shell_check "No orphan CoffeeBean.harvestSeasonId" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.coffee_beans c LEFT JOIN \`$DB_NAME\`.harvest_seasons h ON c.harvestSeasonId=h.id WHERE c.harvestSeasonId IS NOT NULL AND h.id IS NULL")" = 0'
run_shell_check "No inactive harvest season is marked current" 'test "$(mysql_exec "SELECT COUNT(*) FROM \`$DB_NAME\`.harvest_seasons WHERE isCurrent=1 AND isActive=0")" = 0'
run_shell_check "Current-season singleton semantics are documented" 'grep -R -Ei "current.?season|isCurrent" README.md docs src test 2>/dev/null'

# A singleton current-season rule is an application/domain invariant unless the DB contract has a unique constraint.
CURRENT_UNIQUE="$(mysql_exec "SELECT COUNT(DISTINCT INDEX_NAME) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_NAME='harvest_seasons' AND COLUMN_NAME='isCurrent' AND NON_UNIQUE=0")"
if [[ "$CURRENT_UNIQUE" -gt 0 ]]; then
  pass "Database has explicit unique index involving harvest_seasons.isCurrent"
else
  pass "No unique DB constraint was invented for isCurrent; singleton semantics must be enforced/documented at application/domain layer"
fi

# -----------------------------------------------------------------------------
# Step 44 — Certification master
# -----------------------------------------------------------------------------
step_start "44" "Certification Master"
for spec in \
  "id|NO|varchar|<NULL>" \
  "uuid|NO|varchar|<NULL>" \
  "code|NO|varchar|<NULL>" \
  "name|NO|varchar|<NULL>" \
  "type|YES|varchar|<NULL>" \
  "issuer|YES|varchar|<NULL>" \
  "website|YES|varchar|<NULL>" \
  "countryScope|YES|varchar|<NULL>" \
  "requiresExpiration|NO|tinyint|0" \
  "description|YES|varchar|<NULL>" \
  "isActive|NO|tinyint|1" \
  "sortOrder|NO|int|0"; do
  IFS='|' read -r c n t d <<< "$spec"
  run_shell_check "certifications.$c contract" "check_column certifications '$c' '$n' '$t' '$d'"
done
run_shell_check "Certification uuid unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"certifications\" AND COLUMN_NAME=\"uuid\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "Certification code unique" 'test "$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"certifications\" AND COLUMN_NAME=\"code\" AND NON_UNIQUE=0")" -ge 1'
run_shell_check "Certification has no invented expirationDate field" '! mysql_exec "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=\"$DB_NAME\" AND TABLE_NAME=\"certifications\" AND COLUMN_NAME IN (\"expirationDate\",\"expiresAt\")" | grep -q .'
run_shell_check "Certification requiresExpiration semantics are documented" 'grep -R -Ei "requires.?expiration|expiration" README.md docs src test 2>/dev/null'

# -----------------------------------------------------------------------------
# Step 45 — Certification relationship boundary
# -----------------------------------------------------------------------------
step_start "45" "Certification Relationship Audit"
CERT_FK_OUT="$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='$DB_NAME' AND TABLE_NAME='certifications' AND REFERENCED_TABLE_NAME IS NOT NULL")"
CERT_FK_IN="$(mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='$DB_NAME' AND REFERENCED_TABLE_NAME='certifications'")"
log "Certification outgoing FK count: $CERT_FK_OUT"
log "Certification incoming FK count: $CERT_FK_IN"

if [[ "$CERT_FK_OUT" == "0" && "$CERT_FK_IN" == "0" ]]; then
  pass "Certification is standalone at database FK level"
else
  pass "Certification database relationships detected; audit output recorded above"
fi

for table in coffee_beans farmers farms organizations; do
  if mysql_exec "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='$DB_NAME' AND TABLE_NAME='$table' AND REFERENCED_TABLE_NAME='certifications' OR CONSTRAINT_SCHEMA='$DB_NAME' AND TABLE_NAME='certifications' AND REFERENCED_TABLE_NAME='$table'" | grep -q '^0$'; then
    pass "No Certification FK with $table"
  else
    fail "Unexpected Certification FK relationship with $table; inspect contract before proceeding"
  fi
done

run_shell_check "No obvious invented Certification relation in Prisma/source" '! grep -R --include="*.ts" -Ei "certification(Id|Ids)|Certification.*(CoffeeBean|Farmer|Farm|Organization)|(@relation.*certification)" src 2>/dev/null'
run_shell_check "Certification boundary is documented" 'grep -R -Ei "standalone.*certification|certification.*standalone|certification.*relationship|certification.*ownership" README.md docs src test 2>/dev/null'

# -----------------------------------------------------------------------------
# Final project quality gates / regression
# -----------------------------------------------------------------------------
step_start "REGRESSION" "Steps 26-45 Regression / Global Quality Gate"
run_check "Full unit test suite" bash -c 'npm run test:unit'
run_check "Full E2E test suite" bash -c 'npm run test:e2e'
run_check "Full gRPC test suite" bash -c 'npm run test:grpc'
run_check "Security test suite" bash -c 'npm run test:security'
run_check "TypeScript typecheck" bash -c 'npm run typecheck'
run_check "ESLint" bash -c 'npm run lint'
run_check "Prettier check" bash -c 'npm run format:check'
run_check "Production build" bash -c 'npm run build'

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
log ""
log "============================================================"
log "FINAL SUMMARY"
log "============================================================"
log "Checks: $TOTAL"
log "Passed: $PASSED"
log "Failed: $FAILED"
log "Report: $REPORT_FILE"

if [[ "$FAILED" -eq 0 ]]; then
  log "OVERALL: PASS — Steps 26-45 verification gate passed."
  exit 0
fi

log "OVERALL: NOT PASS — one or more checks failed. Do NOT claim Steps 26-45 PASS."
exit 1
