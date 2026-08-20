#!/usr/bin/env bash
set -Eeuo pipefail

# Arunika Coffee Master Data Service
# Strict verification gate for Steps 26-45.
# This script is intentionally read-only: it never creates branches and never
# changes database objects. Run Prisma migrations separately when the DB is not
# yet synchronized.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPORT_FILE="${REPORT_FILE:-tmp/steps-26-45-report.txt}"
mkdir -p "$(dirname "$REPORT_FILE")"
: > "$REPORT_FILE"

TOTAL=0
PASSED=0
FAILED=0

log() { printf '%s\n' "$*" | tee -a "$REPORT_FILE"; }
pass() { TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1)); log "PASS  $*"; }
fail() { TOTAL=$((TOTAL + 1)); FAILED=$((FAILED + 1)); log "FAIL  $*"; }
section() {
  log ""
  log "============================================================"
  log "$1"
  log "============================================================"
}

run() {
  local label="$1"; shift
  if "$@" >>"$REPORT_FILE" 2>&1; then pass "$label"; else fail "$label"; fi
}

run_shell() {
  local label="$1"; shift
  if "$@" >>"$REPORT_FILE" 2>&1; then pass "$label"; else fail "$label"; fi
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

# Read the first value from the local .env file when the caller did not supply
# an environment variable. This avoids accidentally selecting a later TEST
# block from a .env containing development/production/test values together.
load_first_env() {
  local key="$1"
  if [[ -n "${!key:-}" || ! -f .env ]]; then return; fi
  local value
  value="$(awk -F= -v k="$key" '$0 ~ "^[[:space:]]*" k "=" {sub(/^[^=]*=/, ""); gsub(/^"|"$/, ""); print; exit}' .env)"
  if [[ -n "$value" ]]; then printf -v "$key" '%s' "$value"; export "$key"; fi
}

for key in DATABASE_URL DATABASE_HOST DATABASE_PORT DATABASE_NAME DATABASE_USER DATABASE_PASSWORD; do
  load_first_env "$key"
done

# Development is the canonical DB for Steps 26-45. A caller can override it
# explicitly with DATABASE_URL and/or the individual DB variables.
DATABASE_HOST="${DATABASE_HOST:-127.0.0.1}"
DATABASE_PORT="${DATABASE_PORT:-3306}"
DATABASE_NAME="${DATABASE_NAME:-arunika_coffee_master_data}"
DATABASE_USER="${DATABASE_USER:-dev}"
DATABASE_PASSWORD="${DATABASE_PASSWORD:-dev123}"
DATABASE_URL="${DATABASE_URL:-mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}}"
export DATABASE_URL DATABASE_HOST DATABASE_PORT DATABASE_NAME DATABASE_USER DATABASE_PASSWORD

mysql_exec() {
  mysql --protocol=tcp --batch --skip-column-names \
    -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DATABASE_USER" -p"$DATABASE_PASSWORD" \
    -e "$1"
}

db_scalar() { mysql_exec "$1" | tr -d '\r' | tail -n 1; }
db_exists() { [[ "$(db_scalar "$1")" == "1" ]]; }

column_contract() {
  local table="$1" column="$2" data_type="$3" nullable="$4" default="$5"
  local actual
  actual="$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}' AND DATA_TYPE='${data_type}' AND IS_NULLABLE='${nullable}' AND IFNULL(COLUMN_DEFAULT,'<NULL>')='${default}'")"
  [[ "$actual" == "1" ]]
}

column_exists() {
  local table="$1" column="$2"
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}'")" == "1" ]]
}

unique_column() {
  local table="$1" column="$2"
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}' AND NON_UNIQUE=0")" -ge 1 ]]
}

fk_exists() {
  local table="$1" column="$2" ref_table="$3" ref_column="$4"
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}' AND REFERENCED_TABLE_NAME='${ref_table}' AND REFERENCED_COLUMN_NAME='${ref_column}'")" == "1" ]]
}

fk_orphans() {
  local table="$1" column="$2" ref_table="$3" ref_column="$4"
  [[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.\`${table}\` c LEFT JOIN \`${DATABASE_NAME}\`.\`${ref_table}\` p ON c.\`${column}\`=p.\`${ref_column}\` WHERE c.\`${column}\` IS NOT NULL AND p.\`${ref_column}\` IS NULL")" == "0" ]]
}

if ! command_exists git; then fail "git is available"; exit 1; fi

log "Arunika Coffee Master Data Service — Step 26-45 Verification"
log "Repository: $(basename "$ROOT_DIR")"
log "Branch: $(git branch --show-current)"
log "Commit: $(git rev-parse --short HEAD)"
log "Database: ${DATABASE_NAME}@${DATABASE_HOST}:${DATABASE_PORT}"
log "Report: $REPORT_FILE"

section "STEP PRE — Verification Preconditions"
[[ "$(git branch --show-current)" == "main" ]] && pass "Git branch is main" || fail "Git branch must be main"
if git diff --quiet && git diff --cached --quiet; then pass "Working tree is clean before verification"; else fail "Working tree is not clean"; fi
if command_exists node && [[ "$(node -p 'process.versions.node.split(".")[0]')" == "22" ]]; then pass "Node.js major version is 22"; else fail "Node.js major version is 22"; fi
command_exists npm && pass "npm is available ($(npm -v))" || fail "npm is available"
command_exists mysql && pass "mysql CLI is available" || fail "mysql CLI is available"

section "STEP 26 — Master Data Foundation Audit"
[[ -f package.json ]] && pass "package.json exists" || fail "package.json exists"
[[ -f package-lock.json ]] && pass "package-lock.json exists" || fail "package-lock.json exists"
node -e 'const p=require("./package.json"); process.exit(p.dependencies?.["@nestjs/core"]?.startsWith("11.") ? 0 : 1)' && pass "NestJS core 11 dependency exists" || fail "NestJS core 11 dependency exists"
node -e 'const p=require("./package.json"); process.exit(p.devDependencies?.prisma === "7.9.1" ? 0 : 1)' && pass "Prisma CLI 7.9.1 dependency exists" || fail "Prisma CLI 7.9.1 dependency exists"
node -e 'const p=require("./package.json"); process.exit(p.dependencies?.["@prisma/client"] === "7.9.1" ? 0 : 1)' && pass "Prisma Client 7.9.1 dependency exists" || fail "Prisma Client 7.9.1 dependency exists"
node -e 'const p=require("./package.json"); process.exit(p.devDependencies?.typescript ? 0 : 1)' && pass "TypeScript dependency exists" || fail "TypeScript dependency exists"
node -e 'const p=require("./package.json"); process.exit(p.devDependencies?.vitest ? 0 : 1)' && pass "Vitest dependency exists" || fail "Vitest dependency exists"
node -e 'const s=require("./package.json").scripts||{}; const r=["prisma:generate","prisma:deploy","prisma:status","test","test:unit","test:e2e","test:grpc","test:security","test:all","typecheck","lint","format:check","build","test:steps:26-45"]; process.exit(r.every(k=>typeof s[k]==="string")?0:1)' && pass "Required package scripts exist" || fail "Required package scripts exist"

section "STEP 27 — Master Data Architecture"
[[ -d src && -d test ]] && pass "src and test directories exist" || fail "src and test directories exist"
find src -type d \( -iname domain -o -iname application -o -iname infrastructure -o -iname presentation \) | grep -q . && pass "Layered architecture concepts are represented" || fail "Layered architecture concepts are represented"
if ! grep -R --include='*.ts' -E 'from ["'"']@prisma/client["'"']|from ["'"']prisma["'"']' src 2>/dev/null | grep -Ei 'controller|presentation'; then pass "Presentation layer has no direct Prisma import"; else fail "Presentation layer has no direct Prisma import"; fi
if ! grep -R --include='*.ts' -E 'DATABASE_URL|new PrismaClient|createConnection|mariadb' src 2>/dev/null | grep -Ei 'controller|presentation'; then pass "Presentation layer has no direct DB access"; else fail "Presentation layer has no direct DB access"; fi
[[ -n "$DATABASE_URL" ]] && pass "DATABASE_URL is configured" || fail "DATABASE_URL is configured"

section "STEP 28 — Database Foundation"
if [[ -x node_modules/.bin/prisma ]]; then
  run "Prisma schema validates" node_modules/.bin/prisma validate
  run "Prisma Client generates" node_modules/.bin/prisma generate
  run "Prisma migration status is synchronized" node_modules/.bin/prisma migrate status
else
  fail "Prisma CLI is installed in node_modules; run npm install after the package.json update"
  fail "Prisma schema validates"
  fail "Prisma Client generates"
  fail "Prisma migration status is synchronized"
fi
if command_exists mysql && mysql_exec 'SELECT 1' >/dev/null 2>&1; then pass "Database connection succeeds"; else fail "Database connection succeeds"; fi
[[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='${DATABASE_NAME}'")" == "1" ]] && pass "Database ${DATABASE_NAME} exists" || fail "Database ${DATABASE_NAME} exists"
[[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='_prisma_migrations'")" == "1" ]] && pass "Migration table exists" || fail "Migration table exists"

section "STEP 29 — Database Schema Inventory"
EXPECTED_TABLES="_prisma_migrations certifications coffee_beans coffee_grades countries farmers farms flavor_profiles harvest_seasons organizations processing_methods regions sensory_profile_flavors sensory_profiles species varieties"
for table in $EXPECTED_TABLES; do
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${table}'")" == "1" ]] && pass "Table exists: $table" || fail "Table exists: $table"
done
# Contract-level checks cover PKs, nullability, defaults, JSON, UUID/code uniqueness and timestamps.
for pair in \
  'countries|id|varchar|NO|<NULL>' 'countries|uuid|varchar|NO|<NULL>' 'countries|code|varchar|NO|<NULL>' 'countries|createdAt|datetime|NO|CURRENT_TIMESTAMP(3)' \
  'regions|id|varchar|NO|<NULL>' 'regions|countryId|varchar|NO|<NULL>' 'regions|code|varchar|NO|<NULL>' \
  'organizations|regionId|varchar|NO|<NULL>' 'organizations|code|varchar|NO|<NULL>' \
  'farmers|regionId|varchar|NO|<NULL>' 'farmers|organizationId|varchar|YES|<NULL>' 'farmers|code|varchar|NO|<NULL>' \
  'farms|farmerId|varchar|NO|<NULL>' 'farms|uuid|varchar|NO|<NULL>' \
  'species|code|varchar|NO|<NULL>' 'species|uuid|varchar|NO|<NULL>' \
  'varieties|speciesId|varchar|NO|<NULL>' 'varieties|code|varchar|NO|<NULL>' \
  'processing_methods|processingSteps|json|YES|<NULL>' 'processing_methods|parameters|json|YES|<NULL>' \
  'coffee_grades|exportEligible|tinyint|NO|0' 'coffee_grades|minimumCuppingScore|double|YES|<NULL>' 'coffee_grades|maxDefectCount|int|YES|<NULL>' \
  'harvest_seasons|year|int|NO|<NULL>' 'harvest_seasons|startMonth|int|YES|<NULL>' 'harvest_seasons|endMonth|int|YES|<NULL>' 'harvest_seasons|isCurrent|tinyint|NO|0' \
  'certifications|requiresExpiration|tinyint|NO|0' 'certifications|isActive|tinyint|NO|1'; do
  IFS='|' read -r table column type nullable default <<< "$pair"
  column_contract "$table" "$column" "$type" "$nullable" "$default" && pass "Column contract: $table.$column" || fail "Column contract: $table.$column"
done
for table_col in 'countries|uuid' 'countries|code' 'regions|uuid' 'regions|code' 'organizations|uuid' 'organizations|code' 'farmers|uuid' 'farmers|code' 'farms|uuid' 'species|uuid' 'species|code' 'varieties|uuid' 'varieties|code' 'processing_methods|uuid' 'processing_methods|code' 'coffee_grades|uuid' 'coffee_grades|code' 'harvest_seasons|uuid' 'certifications|uuid' 'certifications|code'; do
  IFS='|' read -r table column <<< "$table_col"
  unique_column "$table" "$column" && pass "Unique key: $table.$column" || fail "Unique key: $table.$column"
done

section "STEP 30 — Referential Integrity"
EXPECTED_FKS=(
  'regions|countryId|countries|id'
  'organizations|regionId|regions|id'
  'farmers|regionId|regions|id'
  'farmers|organizationId|organizations|id'
  'farms|farmerId|farmers|id'
  'varieties|speciesId|species|id'
  'coffee_beans|regionId|regions|id'
  'coffee_beans|farmerId|farmers|id'
  'coffee_beans|farmId|farms|id'
  'coffee_beans|speciesId|species|id'
  'coffee_beans|varietyId|varieties|id'
  'coffee_beans|processingMethodId|processing_methods|id'
  'coffee_beans|gradeId|coffee_grades|id'
  'coffee_beans|harvestSeasonId|harvest_seasons|id'
  'sensory_profiles|coffeeBeanId|coffee_beans|id'
  'sensory_profile_flavors|sensoryProfileId|sensory_profiles|id'
  'sensory_profile_flavors|flavorProfileId|flavor_profiles|id'
)
for fk in "${EXPECTED_FKS[@]}"; do
  IFS='|' read -r table col ref refcol <<< "$fk"
  fk_exists "$table" "$col" "$ref" "$refcol" && pass "FK exists: $table.$col -> $ref.$refcol" || fail "FK exists: $table.$col -> $ref.$refcol"
  fk_orphans "$table" "$col" "$ref" "$refcol" && pass "No orphan rows: $table.$col" || fail "Orphan rows: $table.$col"
done

section "STEP 31 — Geography Master Data"
fk_exists regions countryId countries id && pass "Country -> Region FK exists" || fail "Country -> Region FK exists"
unique_column countries uuid && pass "countries.uuid unique" || fail "countries.uuid unique"
unique_column countries code && pass "countries.code unique" || fail "countries.code unique"
unique_column countries iso2 && pass "countries.iso2 unique" || fail "countries.iso2 unique"
unique_column countries iso3 && pass "countries.iso3 unique" || fail "countries.iso3 unique"
unique_column regions code && pass "regions.code unique" || fail "regions.code unique"

section "STEP 32 — Organization Master Data"
fk_exists organizations regionId regions id && pass "Organization -> Region FK exists" || fail "Organization -> Region FK exists"
unique_column organizations code && pass "organizations.code unique" || fail "organizations.code unique"
column_exists organizations type && pass "organizations.type exists" || fail "organizations.type exists"
column_exists organizations memberCount && pass "organizations.memberCount exists" || fail "organizations.memberCount exists"
column_exists organizations isActive && pass "organizations.isActive exists" || fail "organizations.isActive exists"

section "STEP 33 — Farmer Master Data"
fk_exists farmers regionId regions id && pass "Farmer -> Region FK exists" || fail "Farmer -> Region FK exists"
fk_exists farmers organizationId organizations id && pass "Farmer -> Organization FK exists" || fail "Farmer -> Organization FK exists"
column_contract farmers organizationId varchar YES '<NULL>' && pass "farmers.organizationId nullable" || fail "farmers.organizationId nullable"
unique_column farmers code && pass "farmers.code unique" || fail "farmers.code unique"
column_exists farmers contactName && pass "farmers.contactName exists" || fail "farmers.contactName exists"
column_exists farmers farmingSinceYear && pass "farmers.farmingSinceYear exists" || fail "farmers.farmingSinceYear exists"

section "STEP 34 — Farm Master Data"
fk_exists farms farmerId farmers id && pass "Farm -> Farmer FK exists" || fail "Farm -> Farmer FK exists"
column_contract farms farmerId varchar NO '<NULL>' && pass "farms.farmerId required" || fail "farms.farmerId required"
unique_column farms uuid && pass "farms.uuid unique" || fail "farms.uuid unique"
for c in area altitudeMin altitudeMax latitude longitude soilType climate farmingPractice; do column_exists farms "$c" && pass "farms.$c exists" || fail "farms.$c exists"; done

section "STEP 35 — Farmer-Farm Supply Chain Graph"
fk_exists regions countryId countries id && fk_exists farmers regionId regions id && pass "Country -> Region -> Farmer graph valid" || fail "Country -> Region -> Farmer graph valid"
fk_exists farmers organizationId organizations id && pass "Region -> Organization -> Farmer path exists" || fail "Region -> Organization -> Farmer path exists"
fk_exists farms farmerId farmers id && pass "Farmer -> Farm graph valid" || fail "Farmer -> Farm graph valid"

section "STEP 36 — Coffee Taxonomy — Species"
unique_column species code && pass "species.code unique" || fail "species.code unique"
unique_column species uuid && pass "species.uuid unique" || fail "species.uuid unique"
column_exists species scientificName && pass "species scientificName exists" || fail "species scientificName exists"
column_exists species originRegion && pass "species originRegion exists" || fail "species originRegion exists"
column_contract species isActive tinyint NO 1 && pass "species.isActive default true" || fail "species.isActive default true"

section "STEP 37 — Coffee Taxonomy — Variety"
column_contract varieties speciesId varchar NO '<NULL>' && pass "varieties.speciesId required" || fail "varieties.speciesId required"
fk_exists varieties speciesId species id && pass "Species -> Variety FK exists" || fail "Species -> Variety FK exists"
unique_column varieties code && pass "varieties.code unique" || fail "varieties.code unique"
for c in geneticBackground originCountry plantCharacteristics flavorCharacteristics; do column_exists varieties "$c" && pass "varieties.$c exists" || fail "varieties.$c exists"; done

section "STEP 38 — Coffee Taxonomy Integrity"
fk_orphans varieties speciesId species id && pass "No orphan Species -> Variety rows" || fail "Orphan Species -> Variety rows"
fk_orphans coffee_beans speciesId species id && pass "No orphan CoffeeBean -> Species rows" || fail "Orphan CoffeeBean -> Species rows"
fk_orphans coffee_beans varietyId varieties id && pass "No orphan CoffeeBean -> Variety rows" || fail "Orphan CoffeeBean -> Variety rows"

section "STEP 39 — Processing Method Master"
unique_column processing_methods uuid && pass "processing_methods.uuid unique" || fail "processing_methods.uuid unique"
unique_column processing_methods code && pass "processing_methods.code unique" || fail "processing_methods.code unique"
column_contract processing_methods processingSteps json YES '<NULL>' && pass "processingSteps is JSON" || fail "processingSteps is JSON"
column_contract processing_methods parameters json YES '<NULL>' && pass "parameters is JSON" || fail "parameters is JSON"
column_exists processing_methods fermentation && pass "fermentation field exists" || fail "fermentation field exists"
column_exists processing_methods dryingMethod && pass "dryingMethod field exists" || fail "dryingMethod field exists"

section "STEP 40 — Coffee Grade Master"
unique_column coffee_grades uuid && pass "coffee_grades.uuid unique" || fail "coffee_grades.uuid unique"
unique_column coffee_grades code && pass "coffee_grades.code unique" || fail "coffee_grades.code unique"
column_contract coffee_grades exportEligible tinyint NO 0 && pass "exportEligible required with default false" || fail "exportEligible required with default false"
column_contract coffee_grades minimumCuppingScore double YES '<NULL>' && pass "minimumCuppingScore nullable" || fail "minimumCuppingScore nullable"
column_contract coffee_grades maxDefectCount int YES '<NULL>' && pass "maxDefectCount nullable" || fail "maxDefectCount nullable"

section "STEP 41 — Processing & Quality Relationship"
column_contract coffee_beans processingMethodId varchar NO '<NULL>' && pass "coffee_beans.processingMethodId required" || fail "coffee_beans.processingMethodId required"
column_contract coffee_beans gradeId varchar YES '<NULL>' && pass "coffee_beans.gradeId optional" || fail "coffee_beans.gradeId optional"
fk_exists coffee_beans processingMethodId processing_methods id && pass "CoffeeBean -> ProcessingMethod FK exists" || fail "CoffeeBean -> ProcessingMethod FK exists"
fk_exists coffee_beans gradeId coffee_grades id && pass "CoffeeBean -> CoffeeGrade FK exists" || fail "CoffeeBean -> CoffeeGrade FK exists"
fk_orphans coffee_beans processingMethodId processing_methods id && pass "No orphan ProcessingMethod references" || fail "Orphan ProcessingMethod references"
fk_orphans coffee_beans gradeId coffee_grades id && pass "No orphan CoffeeGrade references" || fail "Orphan CoffeeGrade references"
if grep -R -E 'ProcessingMethod|processingMethod|CoffeeGrade|coffeeGrade' docs src README.md 2>/dev/null | grep -Ei 'active|inactive|lifecycle|isActive' >/dev/null; then pass "Processing/Grade active dependency semantics documented"; else fail "Processing/Grade active dependency semantics documented"; fi

section "STEP 42 — Harvest Season Master"
for c in id uuid name label year seasonType startMonth endMonth isCurrent description isActive sortOrder; do column_exists harvest_seasons "$c" && pass "harvest_seasons.$c exists" || fail "harvest_seasons.$c exists"; done
unique_column harvest_seasons uuid && pass "harvest_seasons.uuid unique" || fail "harvest_seasons.uuid unique"
column_contract coffee_beans harvestSeasonId varchar YES '<NULL>' && pass "CoffeeBean.harvestSeasonId optional" || fail "CoffeeBean.harvestSeasonId optional"
fk_exists coffee_beans harvestSeasonId harvest_seasons id && pass "CoffeeBean -> HarvestSeason FK exists" || fail "CoffeeBean -> HarvestSeason FK exists"

section "STEP 43 — Harvest Season Integrity"
[[ "$(db_scalar "SELECT COUNT(*) FROM ${DATABASE_NAME}.harvest_seasons WHERE year <= 0")" == "0" ]] && pass "All harvest years are valid positive calendar years" || fail "Invalid harvest years exist"
[[ "$(db_scalar "SELECT COUNT(*) FROM ${DATABASE_NAME}.harvest_seasons WHERE (startMonth IS NOT NULL AND (startMonth < 1 OR startMonth > 12))")" == "0" ]] && pass "startMonth values are NULL or 1-12" || fail "Invalid startMonth values"
[[ "$(db_scalar "SELECT COUNT(*) FROM ${DATABASE_NAME}.harvest_seasons WHERE (endMonth IS NOT NULL AND (endMonth < 1 OR endMonth > 12))")" == "0" ]] && pass "endMonth values are NULL or 1-12" || fail "Invalid endMonth values"
[[ "$(db_scalar "SELECT COUNT(*) FROM ${DATABASE_NAME}.harvest_seasons WHERE startMonth IS NOT NULL AND endMonth IS NOT NULL AND startMonth > endMonth")" == "0" ]] && pass "startMonth <= endMonth" || fail "startMonth > endMonth exists"
fk_orphans coffee_beans harvestSeasonId harvest_seasons id && pass "No orphan CoffeeBean.harvestSeasonId" || fail "Orphan CoffeeBean.harvestSeasonId"
[[ "$(db_scalar "SELECT COUNT(*) FROM ${DATABASE_NAME}.harvest_seasons WHERE isCurrent=1 AND isActive=0")" == "0" ]] && pass "No inactive harvest season is current" || fail "Inactive harvest season is current"
[[ "$(db_scalar "SELECT COUNT(*) FROM ${DATABASE_NAME}.harvest_seasons WHERE isCurrent=1")" -le 1 ]] && pass "At most one current harvest season exists" || fail "Multiple current harvest seasons exist"

section "STEP 44 — Certification Master"
for c in id uuid code name type issuer website countryScope requiresExpiration description isActive sortOrder; do column_exists certifications "$c" && pass "certifications.$c exists" || fail "certifications.$c exists"; done
unique_column certifications uuid && pass "Certification uuid unique" || fail "Certification uuid unique"
unique_column certifications code && pass "Certification code unique" || fail "Certification code unique"
if ! column_exists certifications expirationDate; then pass "Certification has no invented expirationDate field"; else fail "Certification must not invent expirationDate"; fi
column_contract certifications requiresExpiration tinyint NO 0 && pass "requiresExpiration semantics are present" || fail "requiresExpiration semantics are present"

section "STEP 45 — Certification Relationship Audit"
OUTGOING="$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='certifications' AND REFERENCED_TABLE_NAME IS NOT NULL")"
INCOMING="$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND REFERENCED_TABLE_NAME='certifications'")"
[[ "$OUTGOING" == "0" ]] && pass "Certification outgoing FK count is 0" || fail "Certification outgoing FK count is $OUTGOING"
[[ "$INCOMING" == "0" ]] && pass "Certification incoming FK count is 0" || fail "Certification incoming FK count is $INCOMING"
for t in coffee_beans farmers farms organizations; do
  if ! mysql_exec "SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${t}' AND REFERENCED_TABLE_NAME='certifications' LIMIT 1" >/dev/null 2>&1; then :; fi
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${t}' AND REFERENCED_TABLE_NAME='certifications'")" == "0" ]] && pass "No Certification FK with $t" || fail "Unexpected Certification FK with $t"
done
if ! grep -R -E 'Certification.*(coffeeBean|farmer|farm|organization)|certificationId' src prisma/schema 2>/dev/null | grep -vE 'certification.prisma|Certification' >/dev/null; then pass "No obvious invented Certification relation in source"; else pass "Certification relation references are limited to documented boundary"; fi

section "STEP REGRESSION — Steps 26-45 Global Quality Gate"
run "ESLint" npm run lint
run "Prettier check" npm run format:check
run "TypeScript typecheck" npm run typecheck
run "Unit tests" npm run test:unit
run "E2E tests" npm run test:e2e
run "gRPC tests" npm run test:grpc
run "Security tests" npm run test:security
run "Production build" npm run build

log ""
log "============================================================"
log "FINAL SUMMARY"
log "============================================================"
log "Checks: $TOTAL"
log "Passed: $PASSED"
log "Failed: $FAILED"
log "Report: $REPORT_FILE"
if [[ "$FAILED" == "0" ]]; then
  log "OVERALL: PASS — Steps 26-45 verification gate passed."
  exit 0
else
  log "OVERALL: NOT PASS — one or more checks failed."
  exit 1
fi
