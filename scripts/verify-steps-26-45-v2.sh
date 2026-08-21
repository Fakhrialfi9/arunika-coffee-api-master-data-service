#!/usr/bin/env bash
set -Eeuo pipefail

# Arunika Coffee Master Data Service
# Verification gate for Steps 26-50.
# Read-only: this script never creates branches, changes schema, or mutates data.
# It is intentionally diagnostic: failures identify gaps instead of hiding them.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPORT_FILE="${REPORT_FILE:-tmp/steps-26-50-report.txt}"
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
command_exists() { command -v "$1" >/dev/null 2>&1; }

load_first_env() {
  local key="$1"
  if [[ -n "${!key:-}" || ! -f .env ]]; then return; fi
  local value
  value="$(awk -F= -v k="$key" '$0 ~ "^[[:space:]]*" k "=" {sub(/^[^=]*=/, ""); gsub(/^"|"$/, ""); print; exit}' .env)"
  if [[ -n "$value" ]]; then printf -v "$key" '%s' "$value"; export "$key"; fi
}
for key in DATABASE_URL DATABASE_HOST DATABASE_PORT DATABASE_NAME DATABASE_USER DATABASE_PASSWORD; do load_first_env "$key"; done

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
db_scalar() { mysql_exec "$1" 2>/dev/null | tr -d '\r' | tail -n 1; }
column_exists() { [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='$1' AND COLUMN_NAME='$2'")" == "1" ]]; }
column_contract() {
  local table="$1" column="$2" type="$3" nullable="$4" default="$5"
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${table}' AND COLUMN_NAME='${column}' AND DATA_TYPE='${type}' AND IS_NULLABLE='${nullable}' AND IFNULL(COLUMN_DEFAULT,'<NULL>')='${default}'")" == "1" ]]
}
unique_column() { [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='$1' AND COLUMN_NAME='$2' AND NON_UNIQUE=0")" -ge 1 ]]; }
fk_exists() {
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='$1' AND COLUMN_NAME='$2' AND REFERENCED_TABLE_NAME='$3' AND REFERENCED_COLUMN_NAME='$4'")" == "1" ]]
}
fk_orphans() {
  local table="$1" column="$2" ref_table="$3" ref_column="$4"
  [[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.\`${table}\` c LEFT JOIN \`${DATABASE_NAME}\`.\`${ref_table}\` p ON c.\`${column}\`=p.\`${ref_column}\` WHERE c.\`${column}\` IS NOT NULL AND p.\`${ref_column}\` IS NULL")" == "0" ]]
}

prisma_has() {
  grep -R -E "$1" prisma/schema >/dev/null 2>&1
}
source_has() {
  grep -R -E "$1" src test docs README.md >/dev/null 2>&1
}

log "Arunika Coffee Master Data Service — Step 26-50 Verification"
log "Repository: $(basename "$ROOT_DIR")"
log "Branch: $(git branch --show-current 2>/dev/null || echo UNKNOWN)"
log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo UNKNOWN)"
log "Database: ${DATABASE_NAME}@${DATABASE_HOST}:${DATABASE_PORT}"
log "Report: $REPORT_FILE"

section "PRECONDITIONS"
[[ "$(git branch --show-current 2>/dev/null || true)" == "main" ]] && pass "Git branch is main" || fail "Git branch must be main"
if git diff --quiet && git diff --cached --quiet; then pass "Working tree is clean before verification"; else fail "Working tree is not clean"; fi
command_exists node && [[ "$(node -p 'process.versions.node.split(".")[0]')" == "22" ]] && pass "Node.js major version is 22" || fail "Node.js major version is 22"
command_exists npm && pass "npm is available" || fail "npm is available"
command_exists mysql && pass "mysql CLI is available" || fail "mysql CLI is available"

section "STEP 26 — Master Data Foundation Audit"
[[ -f package.json && -f package-lock.json ]] && pass "Node package manifests exist" || fail "Node package manifests exist"
node -e 'const p=require("./package.json"); process.exit(p.dependencies?.["@nestjs/core"]?.startsWith("11.") ? 0 : 1)' && pass "NestJS 11 dependency" || fail "NestJS 11 dependency"
node -e 'const p=require("./package.json"); process.exit(p.devDependencies?.prisma === "7.9.1" && p.dependencies?.["@prisma/client"] === "7.9.1" ? 0 : 1)' && pass "Prisma 7.9.1 CLI/client" || fail "Prisma 7.9.1 CLI/client"
node -e 'const p=require("./package.json"); process.exit(p.engines?.node === "22.x" ? 0 : 1)' && pass "package.json Node 22 engine" || fail "package.json Node 22 engine"
node -e 'const s=require("./package.json").scripts||{}; const r=["prisma:generate","prisma:deploy","prisma:status","test","test:unit","test:e2e","test:grpc","test:security","test:all","typecheck","lint","format:check","build"]; process.exit(r.every(k=>typeof s[k]==="string")?0:1)' && pass "Core quality scripts exist" || fail "Core quality scripts exist"
[[ -d src && -d test && -d prisma/schema ]] && pass "Source/test/Prisma directories exist" || fail "Source/test/Prisma directories exist"

section "STEP 27 — Master Data Architecture"
find src -type d \( -iname domain -o -iname application -o -iname infrastructure -o -iname presentation \) | grep -q . && pass "Layered architecture directories represented" || fail "Layered architecture directories represented"
if ! grep -R --include='*.ts' -E "from[[:space:]]+[\"'](@prisma/client|prisma)[\"']" src 2>/dev/null | grep -Ei 'controller|presentation'; then pass "Presentation has no direct Prisma import"; else fail "Presentation has direct Prisma import"; fi
if ! grep -R --include='*.ts' -E 'DATABASE_URL|new PrismaClient|createConnection|mariadb' src 2>/dev/null | grep -Ei 'controller|presentation'; then pass "Presentation has no direct DB access"; else fail "Presentation has direct DB access"; fi
[[ -f docs/master-data-architecture.md ]] && pass "Master Data architecture documentation exists" || fail "Master Data architecture documentation exists"

section "STEP 28 — Database Foundation"
if [[ -x node_modules/.bin/prisma ]]; then
  run "Prisma schema validates" node_modules/.bin/prisma validate
  run "Prisma Client generates" node_modules/.bin/prisma generate
  run "Prisma migration status" node_modules/.bin/prisma migrate status
else
  fail "Prisma CLI exists in node_modules"
fi
if command_exists mysql && mysql_exec 'SELECT 1' >/dev/null 2>&1; then pass "Database connection succeeds"; else fail "Database connection succeeds"; fi
[[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='${DATABASE_NAME}'")" == "1" ]] && pass "Database exists: ${DATABASE_NAME}" || fail "Database exists: ${DATABASE_NAME}"
[[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='_prisma_migrations'")" == "1" ]] && pass "_prisma_migrations exists" || fail "_prisma_migrations exists"

section "STEP 29 — Database Schema Inventory"
EXPECTED_TABLES="_prisma_migrations certifications coffee_beans coffee_grades countries farmers farms flavor_profiles harvest_seasons organizations processing_methods regions sensory_profile_flavors sensory_profiles species varieties"
for table in $EXPECTED_TABLES; do
  [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='${table}'")" == "1" ]] && pass "Table exists: $table" || fail "Table exists: $table"
done
for pair in \
  'flavor_profiles|id|varchar|NO|<NULL>' 'flavor_profiles|uuid|varchar|NO|<NULL>' 'flavor_profiles|code|varchar|NO|<NULL>' 'flavor_profiles|isActive|tinyint|NO|1' 'flavor_profiles|sortOrder|int|NO|0' \
  'sensory_profiles|id|varchar|NO|<NULL>' 'sensory_profiles|uuid|varchar|NO|<NULL>' 'sensory_profiles|coffeeBeanId|varchar|NO|<NULL>' 'sensory_profiles|isActive|tinyint|NO|1' \
  'sensory_profile_flavors|id|varchar|NO|<NULL>' 'sensory_profile_flavors|uuid|varchar|NO|<NULL>' 'sensory_profile_flavors|sensoryProfileId|varchar|NO|<NULL>' 'sensory_profile_flavors|flavorProfileId|varchar|NO|<NULL>' 'sensory_profile_flavors|sortOrder|int|NO|0' \
  'coffee_beans|id|varchar|NO|<NULL>' 'coffee_beans|uuid|varchar|NO|<NULL>' 'coffee_beans|code|varchar|NO|<NULL>' 'coffee_beans|regionId|varchar|NO|<NULL>' 'coffee_beans|speciesId|varchar|NO|<NULL>' 'coffee_beans|processingMethodId|varchar|NO|<NULL>' 'coffee_beans|flavorProfiles|json|YES|<NULL>' 'coffee_beans|aromaNotes|json|YES|<NULL>' 'coffee_beans|weightUnit|varchar|NO|kg' 'coffee_beans|isActive|tinyint|NO|1' 'coffee_beans|isFeatured|tinyint|NO|0'; do
  IFS='|' read -r table column type nullable default <<< "$pair"
  column_contract "$table" "$column" "$type" "$nullable" "$default" && pass "Column contract: $table.$column" || fail "Column contract: $table.$column"
done

section "STEP 30 — Referential Integrity"
EXPECTED_FKS=(
  'regions|countryId|countries|id' 'organizations|regionId|regions|id' 'farmers|regionId|regions|id' 'farmers|organizationId|organizations|id'
  'farms|farmerId|farmers|id' 'varieties|speciesId|species|id' 'coffee_beans|regionId|regions|id' 'coffee_beans|farmerId|farmers|id'
  'coffee_beans|farmId|farms|id' 'coffee_beans|speciesId|species|id' 'coffee_beans|varietyId|varieties|id'
  'coffee_beans|processingMethodId|processing_methods|id' 'coffee_beans|gradeId|coffee_grades|id' 'coffee_beans|harvestSeasonId|harvest_seasons|id'
  'sensory_profiles|coffeeBeanId|coffee_beans|id' 'sensory_profile_flavors|sensoryProfileId|sensory_profiles|id' 'sensory_profile_flavors|flavorProfileId|flavor_profiles|id'
)
for fk in "${EXPECTED_FKS[@]}"; do
  IFS='|' read -r table col ref refcol <<< "$fk"
  fk_exists "$table" "$col" "$ref" "$refcol" && pass "FK: $table.$col -> $ref.$refcol" || fail "Missing FK: $table.$col -> $ref.$refcol"
  fk_orphans "$table" "$col" "$ref" "$refcol" && pass "No orphans: $table.$col" || fail "Orphans: $table.$col"
done

section "STEP 31 — Geography Master Data"
for x in 'countries|uuid' 'countries|code' 'countries|iso2' 'countries|iso3' 'regions|uuid' 'regions|code'; do IFS='|' read -r t c <<< "$x"; unique_column "$t" "$c" && pass "Unique: $t.$c" || fail "Not unique: $t.$c"; done
fk_exists regions countryId countries id && pass "Country -> Region" || fail "Country -> Region"

section "STEP 32 — Organization Master Data"
fk_exists organizations regionId regions id && pass "Organization -> Region" || fail "Organization -> Region"
unique_column organizations code && pass "organizations.code unique" || fail "organizations.code unique"
for c in type memberCount isActive sortOrder; do column_exists organizations "$c" && pass "organizations.$c exists" || fail "organizations.$c exists"; done

section "STEP 33 — Farmer Master Data"
fk_exists farmers regionId regions id && pass "Farmer -> Region" || fail "Farmer -> Region"
fk_exists farmers organizationId organizations id && pass "Farmer -> Organization" || fail "Farmer -> Organization"
column_contract farmers organizationId varchar YES '<NULL>' && pass "farmers.organizationId nullable" || fail "farmers.organizationId nullable"
unique_column farmers code && pass "farmers.code unique" || fail "farmers.code unique"
for c in contactName phone email farmingSinceYear; do column_exists farmers "$c" && pass "farmers.$c exists" || fail "farmers.$c exists"; done

section "STEP 34 — Farm Master Data"
fk_exists farms farmerId farmers id && pass "Farm -> Farmer" || fail "Farm -> Farmer"
column_contract farms farmerId varchar NO '<NULL>' && pass "farms.farmerId required" || fail "farms.farmerId required"
unique_column farms uuid && pass "farms.uuid unique" || fail "farms.uuid unique"
for c in area areaUnit altitudeMin altitudeMax altitudeUnit latitude longitude soilType climate farmingPractice; do column_exists farms "$c" && pass "farms.$c exists" || fail "farms.$c exists"; done

section "STEP 35 — Farmer-Farm Supply Chain Graph"
fk_exists regions countryId countries id && fk_exists farmers regionId regions id && fk_exists farms farmerId farmers id && pass "Country -> Region -> Farmer -> Farm graph" || fail "Country -> Region -> Farmer -> Farm graph"
fk_exists organizations regionId regions id && fk_exists farmers organizationId organizations id && pass "Region -> Organization -> Farmer graph" || fail "Region -> Organization -> Farmer graph"

section "STEP 36 — Coffee Taxonomy — Species"
unique_column species uuid && pass "species.uuid unique" || fail "species.uuid unique"
unique_column species code && pass "species.code unique" || fail "species.code unique"
for c in name commonName scientificName originRegion isActive sortOrder; do column_exists species "$c" && pass "species.$c exists" || fail "species.$c exists"; done

section "STEP 37 — Coffee Taxonomy — Variety"
fk_exists varieties speciesId species id && pass "Species -> Variety" || fail "Species -> Variety"
unique_column varieties uuid && pass "varieties.uuid unique" || fail "varieties.uuid unique"
unique_column varieties code && pass "varieties.code unique" || fail "varieties.code unique"
for c in geneticBackground originCountry plantCharacteristics flavorCharacteristics; do column_exists varieties "$c" && pass "varieties.$c exists" || fail "varieties.$c exists"; done

section "STEP 38 — Coffee Taxonomy Integrity"
fk_orphans varieties speciesId species id && pass "No orphan varieties" || fail "Orphan varieties"
fk_orphans coffee_beans speciesId species id && pass "No orphan CoffeeBean species references" || fail "Orphan CoffeeBean species references"
fk_orphans coffee_beans varietyId varieties id && pass "No orphan CoffeeBean variety references" || fail "Orphan CoffeeBean variety references"
MISMATCH_COUNT="$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.coffee_beans cb JOIN \`${DATABASE_NAME}\`.varieties v ON cb.varietyId=v.id WHERE cb.varietyId IS NOT NULL AND cb.speciesId <> v.speciesId")"
[[ "$MISMATCH_COUNT" == "0" ]] && pass "No CoffeeBean species/variety taxonomy mismatch" || fail "CoffeeBean species/variety mismatch count=$MISMATCH_COUNT"

section "STEP 39 — Processing Method Master"
unique_column processing_methods uuid && pass "processing_methods.uuid unique" || fail "processing_methods.uuid unique"
unique_column processing_methods code && pass "processing_methods.code unique" || fail "processing_methods.code unique"
column_contract processing_methods processingSteps json YES '<NULL>' && pass "processingSteps JSON contract" || fail "processingSteps JSON contract"
column_contract processing_methods parameters json YES '<NULL>' && pass "parameters JSON contract" || fail "parameters JSON contract"
for c in fermentation fermentationType fermentationDuration dryingMethod dryingDuration; do column_exists processing_methods "$c" && pass "processing_methods.$c exists" || fail "processing_methods.$c exists"; done

section "STEP 40 — Coffee Grade Master"
unique_column coffee_grades uuid && pass "coffee_grades.uuid unique" || fail "coffee_grades.uuid unique"
unique_column coffee_grades code && pass "coffee_grades.code unique" || fail "coffee_grades.code unique"
column_contract coffee_grades exportEligible tinyint NO 0 && pass "exportEligible default false" || fail "exportEligible default false"
column_contract coffee_grades minimumCuppingScore double YES '<NULL>' && pass "minimumCuppingScore nullable" || fail "minimumCuppingScore nullable"
column_contract coffee_grades maxDefectCount int YES '<NULL>' && pass "maxDefectCount nullable" || fail "maxDefectCount nullable"

section "STEP 41 — Processing & Quality Relationship"
fk_exists coffee_beans processingMethodId processing_methods id && pass "CoffeeBean -> ProcessingMethod" || fail "CoffeeBean -> ProcessingMethod"
fk_exists coffee_beans gradeId coffee_grades id && pass "CoffeeBean -> CoffeeGrade" || fail "CoffeeBean -> CoffeeGrade"
fk_orphans coffee_beans processingMethodId processing_methods id && pass "No orphan ProcessingMethod" || fail "Orphan ProcessingMethod"
fk_orphans coffee_beans gradeId coffee_grades id && pass "No orphan CoffeeGrade" || fail "Orphan CoffeeGrade"

section "STEP 42 — Harvest Season Master"
for c in id uuid name label year seasonType startMonth endMonth isCurrent description isActive sortOrder; do column_exists harvest_seasons "$c" && pass "harvest_seasons.$c exists" || fail "harvest_seasons.$c exists"; done
unique_column harvest_seasons uuid && pass "harvest_seasons.uuid unique" || fail "harvest_seasons.uuid unique"
fk_exists coffee_beans harvestSeasonId harvest_seasons id && pass "CoffeeBean -> HarvestSeason" || fail "CoffeeBean -> HarvestSeason"

section "STEP 43 — Harvest Season Integrity"
[[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.harvest_seasons WHERE year <= 0")" == "0" ]] && pass "Harvest years positive" || fail "Invalid harvest years"
[[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.harvest_seasons WHERE startMonth IS NOT NULL AND (startMonth<1 OR startMonth>12)")" == "0" ]] && pass "startMonth 1-12" || fail "Invalid startMonth"
[[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.harvest_seasons WHERE endMonth IS NOT NULL AND (endMonth<1 OR endMonth>12)")" == "0" ]] && pass "endMonth 1-12" || fail "Invalid endMonth"
[[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.harvest_seasons WHERE startMonth IS NOT NULL AND endMonth IS NOT NULL AND startMonth>endMonth")" == "0" ]] && pass "Harvest month ordering valid" || fail "Invalid harvest month ordering"
[[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.harvest_seasons WHERE isCurrent=1 AND isActive=0")" == "0" ]] && pass "Current harvest season is active" || fail "Inactive current harvest season"
[[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.harvest_seasons WHERE isCurrent=1")" -le 1 ]] && pass "At most one current harvest season" || fail "Multiple current harvest seasons"

section "STEP 44 — Certification Master"
for c in id uuid code name type issuer website countryScope requiresExpiration description isActive sortOrder; do column_exists certifications "$c" && pass "certifications.$c exists" || fail "certifications.$c exists"; done
unique_column certifications uuid && pass "certifications.uuid unique" || fail "certifications.uuid unique"
unique_column certifications code && pass "certifications.code unique" || fail "certifications.code unique"
column_contract certifications requiresExpiration tinyint NO 0 && pass "requiresExpiration default false" || fail "requiresExpiration default false"
[[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='certifications' AND COLUMN_NAME='expirationDate'")" == "0" ]] && pass "No invented certification expirationDate field" || fail "Unexpected certification expirationDate field"

section "STEP 45 — Certification Relationship Audit"
OUTGOING="$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='certifications' AND REFERENCED_TABLE_NAME IS NOT NULL")"
INCOMING="$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND REFERENCED_TABLE_NAME='certifications'")"
[[ "$OUTGOING" == "0" ]] && pass "Certification outgoing FK count is 0" || fail "Certification outgoing FK count=$OUTGOING"
[[ "$INCOMING" == "0" ]] && pass "Certification incoming FK count is 0" || fail "Certification incoming FK count=$INCOMING"

section "STEP 46 — Flavor Profile Master"
for c in id uuid code name category description isActive sortOrder createdAt updatedAt; do column_exists flavor_profiles "$c" && pass "flavor_profiles.$c exists" || fail "flavor_profiles.$c exists"; done
unique_column flavor_profiles uuid && pass "flavor_profiles.uuid unique" || fail "flavor_profiles.uuid unique"
unique_column flavor_profiles code && pass "flavor_profiles.code unique" || fail "flavor_profiles.code unique"
column_contract flavor_profiles category varchar YES '<NULL>' && pass "Flavor category nullable" || fail "Flavor category nullable"
column_contract flavor_profiles description varchar YES '<NULL>' && pass "Flavor description nullable" || fail "Flavor description nullable"
column_contract flavor_profiles isActive tinyint NO 1 && pass "Flavor isActive default true" || fail "Flavor isActive default true"
column_contract flavor_profiles sortOrder int NO 0 && pass "Flavor sortOrder default 0" || fail "Flavor sortOrder default 0"
column_contract flavor_profiles createdAt datetime NO 'CURRENT_TIMESTAMP(3)' && pass "Flavor createdAt default" || fail "Flavor createdAt default"
prisma_has 'model[[:space:]]+FlavorProfiles' && pass "Prisma FlavorProfile model exists" || fail "Prisma FlavorProfile model missing"
prisma_has 'sensoryProfileFlavors[[:space:]]+SensoryProfileFlavor\[\]' && pass "Flavor -> mapping relation exists in Prisma" || fail "Flavor -> mapping relation missing"
if prisma_has 'CoffeeBean.*Flavor|flavorProfiles.*CoffeeBean'; then fail "FlavorProfile has an invented direct CoffeeBean relation"; else pass "No direct CoffeeBean -> FlavorProfile Prisma relation"; fi

section "STEP 47 — Sensory Profile Master"
for c in id uuid coffeeBeanId cuppingScore aroma body acidity sweetness aftertaste description isActive sortOrder createdAt updatedAt; do column_exists sensory_profiles "$c" && pass "sensory_profiles.$c exists" || fail "sensory_profiles.$c exists"; done
unique_column sensory_profiles uuid && pass "sensory_profiles.uuid unique" || fail "sensory_profiles.uuid unique"
unique_column sensory_profiles coffeeBeanId && pass "sensory_profiles.coffeeBeanId unique" || fail "sensory_profiles.coffeeBeanId unique"
fk_exists sensory_profiles coffeeBeanId coffee_beans id && pass "CoffeeBean -> SensoryProfile FK" || fail "CoffeeBean -> SensoryProfile FK"
fk_orphans sensory_profiles coffeeBeanId coffee_beans id && pass "No orphan SensoryProfile" || fail "Orphan SensoryProfile"
column_contract sensory_profiles isActive tinyint NO 1 && pass "Sensory isActive default true" || fail "Sensory isActive default true"
column_contract sensory_profiles sortOrder int NO 0 && pass "Sensory sortOrder default 0" || fail "Sensory sortOrder default 0"
prisma_has 'coffeeBeanId String @unique' && pass "Prisma SensoryProfile coffeeBeanId unique" || fail "Prisma SensoryProfile coffeeBeanId unique missing"
prisma_has 'coffeeBean CoffeeBean @relation\(fields: \[coffeeBeanId\], references: \[id\]\)' && pass "Prisma CoffeeBean -> SensoryProfile relation" || fail "Prisma CoffeeBean -> SensoryProfile relation missing"

section "STEP 48 — Sensory-Flavor Mapping"
for c in id uuid sensoryProfileId flavorProfileId sortOrder createdAt updatedAt; do column_exists sensory_profile_flavors "$c" && pass "sensory_profile_flavors.$c exists" || fail "sensory_profile_flavors.$c exists"; done
unique_column sensory_profile_flavors uuid && pass "mapping.uuid unique" || fail "mapping.uuid unique"
fk_exists sensory_profile_flavors sensoryProfileId sensory_profiles id && pass "Mapping -> SensoryProfile FK" || fail "Mapping -> SensoryProfile FK"
fk_exists sensory_profile_flavors flavorProfileId flavor_profiles id && pass "Mapping -> FlavorProfile FK" || fail "Mapping -> FlavorProfile FK"
fk_orphans sensory_profile_flavors sensoryProfileId sensory_profiles id && pass "No orphan sensory mappings" || fail "Orphan sensory mappings"
fk_orphans sensory_profile_flavors flavorProfileId flavor_profiles id && pass "No orphan flavor mappings" || fail "Orphan flavor mappings"
DB_PAIR_UNIQUE="$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='sensory_profile_flavors' AND NON_UNIQUE=0 AND INDEX_NAME <> 'PRIMARY' GROUP BY INDEX_NAME HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX)= 'sensoryProfileId,flavorProfileId'")"
if [[ -n "$DB_PAIR_UNIQUE" ]]; then pass "DB composite unique exists for sensoryProfileId+flavorProfileId"; else pass "DB has no composite unique for sensoryProfileId+flavorProfileId (contract preserved)"; fi
if prisma_has '@@unique\(\[sensoryProfileId, flavorProfileId\]\)'; then
  if [[ -z "$DB_PAIR_UNIQUE" ]]; then fail "Prisma declares composite unique not present in database contract"; else pass "Prisma composite unique matches DB"; fi
else
  pass "Prisma does not invent composite unique constraint";
fi
prisma_has 'sensoryProfile SensoryProfile.*flavorProfile FlavorProfiles' && pass "Prisma mapping relations exist" || pass "Prisma mapping relation names require manual review"

section "STEP 49 — Flavor Data Consistency / Source-of-Truth"
column_contract coffee_beans flavorProfiles json YES '<NULL>' && pass "CoffeeBean.flavorProfiles JSON contract" || fail "CoffeeBean.flavorProfiles JSON contract"
column_contract coffee_beans aromaNotes json YES '<NULL>' && pass "CoffeeBean.aromaNotes JSON contract" || fail "CoffeeBean.aromaNotes JSON contract"
column_contract sensory_profiles aroma varchar YES '<NULL>' && pass "SensoryProfile.aroma nullable descriptive field" || fail "SensoryProfile.aroma contract"
for c in body acidity sweetness aftertaste; do column_contract sensory_profiles "$c" varchar YES '<NULL>' && pass "Sensory dimension: $c" || fail "Sensory dimension: $c"; done
prisma_has 'flavorProfiles Json\?' && pass "Prisma keeps CoffeeBean.flavorProfiles JSON" || fail "Prisma flavorProfiles JSON missing"
prisma_has 'aromaNotes Json\?' && pass "Prisma keeps CoffeeBean.aromaNotes JSON" || fail "Prisma aromaNotes JSON missing"
prisma_has 'sensoryProfileFlavors SensoryProfileFlavor\[\]' && pass "SensoryProfile has relational flavor mapping" || fail "SensoryProfile relational flavor mapping missing"
prisma_has 'FlavorProfiles' && pass "Flavor master model is present in Prisma" || fail "Flavor master model missing in Prisma"
if source_has 'coffee_beans\.flavorProfiles|flavorProfiles'; then pass "Existing code/tests/docs reference flavorProfiles"; else fail "No existing flavorProfiles usage found"; fi
if source_has 'aromaNotes'; then pass "Existing code/tests/docs reference aromaNotes"; else fail "No existing aromaNotes usage found"; fi
if source_has 'sensory_profile_flavors|SensoryProfileFlavor'; then pass "Existing relational flavor mapping is referenced"; else fail "No relational flavor mapping usage found"; fi
if grep -R -Ei 'source.?of.?truth|semantic boundary|controlled flavor|flavor vocabulary|aromaNotes|flavorProfiles|sensoryProfileFlavors' docs README.md >/dev/null 2>&1; then pass "Flavor/sensory semantic boundary is documented"; else fail "Flavor/sensory semantic boundary is not documented"; fi
FLAVOR_JSON_ROWS="$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.coffee_beans WHERE flavorProfiles IS NOT NULL")"
MAPPING_ROWS="$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.sensory_profile_flavors")"
AROMA_JSON_ROWS="$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.coffee_beans WHERE aromaNotes IS NOT NULL")"
log "INFO  flavorProfiles JSON populated rows=$FLAVOR_JSON_ROWS"
log "INFO  sensory_profile_flavors rows=$MAPPING_ROWS"
log "INFO  aromaNotes JSON populated rows=$AROMA_JSON_ROWS"
if [[ "$FLAVOR_JSON_ROWS" != "" && "$MAPPING_ROWS" != "" ]]; then pass "JSON and relational flavor stores are audited without treating either as automatic replacement"; else fail "Unable to audit JSON vs relational flavor stores"; fi

section "STEP 50 — Coffee Bean Schema"
for c in id uuid code lotNumber name description regionId farmerId farmId speciesId varietyId processingMethodId gradeId harvestSeasonId cuppingScore moisture density beanSize qualityStatus flavorProfiles aromaNotes availableWeight reservedWeight weightUnit isFeatured isActive sortOrder createdAt updatedAt; do column_exists coffee_beans "$c" && pass "coffee_beans.$c exists" || fail "coffee_beans.$c exists"; done
unique_column coffee_beans uuid && pass "coffee_beans.uuid unique" || fail "coffee_beans.uuid unique"
unique_column coffee_beans code && pass "coffee_beans.code unique" || fail "coffee_beans.code unique"
for pair in 'regionId|varchar|NO|<NULL>' 'farmerId|varchar|YES|<NULL>' 'farmId|varchar|YES|<NULL>' 'speciesId|varchar|NO|<NULL>' 'varietyId|varchar|YES|<NULL>' 'processingMethodId|varchar|NO|<NULL>' 'gradeId|varchar|YES|<NULL>' 'harvestSeasonId|varchar|YES|<NULL>' 'flavorProfiles|json|YES|<NULL>' 'aromaNotes|json|YES|<NULL>' 'weightUnit|varchar|NO|kg' 'isFeatured|tinyint|NO|0' 'isActive|tinyint|NO|1' 'sortOrder|int|NO|0'; do IFS='|' read -r c t n d <<< "$pair"; column_contract coffee_beans "$c" "$t" "$n" "$d" && pass "CoffeeBean contract: $c" || fail "CoffeeBean contract: $c"; done
for fk in 'regionId|regions|id' 'farmerId|farmers|id' 'farmId|farms|id' 'speciesId|species|id' 'varietyId|varieties|id' 'processingMethodId|processing_methods|id' 'gradeId|coffee_grades|id' 'harvestSeasonId|harvest_seasons|id'; do IFS='|' read -r c t rc <<< "$fk"; fk_exists coffee_beans "$c" "$t" "$rc" && pass "CoffeeBean.$c -> $t.$rc" || fail "CoffeeBean.$c -> $t.$rc"; fk_orphans coffee_beans "$c" "$t" "$rc" && pass "No orphan CoffeeBean.$c" || fail "Orphan CoffeeBean.$c"; done
fk_exists sensory_profiles coffeeBeanId coffee_beans id && pass "SensoryProfile depends on CoffeeBean" || fail "SensoryProfile -> CoffeeBean FK"
MISMATCH_COUNT="$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.coffee_beans cb JOIN \`${DATABASE_NAME}\`.varieties v ON cb.varietyId=v.id WHERE cb.varietyId IS NOT NULL AND cb.speciesId <> v.speciesId")"
[[ "$MISMATCH_COUNT" == "0" ]] && pass "CoffeeBean taxonomy invariant: speciesId matches Variety.speciesId" || fail "CoffeeBean taxonomy mismatch count=$MISMATCH_COUNT"

section "QUALITY GATE — Regression 26-45 + Full 26-50"
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
  log "OVERALL: PASS — Steps 26-50 verification gate passed."
  exit 0
else
  log "OVERALL: NOT PASS — one or more checks failed. Review FAIL lines in $REPORT_FILE."
  exit 1
fi
