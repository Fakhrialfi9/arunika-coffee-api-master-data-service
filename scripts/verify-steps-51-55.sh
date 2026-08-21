#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REPORT_FILE="${REPORT_FILE:-tmp/steps-51-55-report.txt}"
mkdir -p "$(dirname "$REPORT_FILE")"
: > "$REPORT_FILE"
TOTAL=0; PASSED=0; FAILED=0
log() { printf '%s\n' "$*" | tee -a "$REPORT_FILE"; }
pass() { TOTAL=$((TOTAL+1)); PASSED=$((PASSED+1)); log "PASS  $*"; }
fail() { TOTAL=$((TOTAL+1)); FAILED=$((FAILED+1)); log "FAIL  $*"; }
run() { local label="$1"; shift; if "$@" >>"$REPORT_FILE" 2>&1; then pass "$label"; else fail "$label"; fi; }
command_exists() { command -v "$1" >/dev/null 2>&1; }
load_first_env() { local key="$1"; [[ -n "${!key:-}" || ! -f .env ]] && return; local value; value="$(awk -F= -v k="$key" '$0 ~ "^[[:space:]]*" k "=" {sub(/^[^=]*=/, ""); gsub(/^"|"$/, ""); print; exit}' .env)"; [[ -n "$value" ]] && { printf -v "$key" '%s' "$value"; export "$key"; }; }
for key in DATABASE_HOST DATABASE_PORT DATABASE_NAME DATABASE_USER DATABASE_PASSWORD DATABASE_URL; do load_first_env "$key"; done
DATABASE_HOST="${DATABASE_HOST:-127.0.0.1}"; DATABASE_PORT="${DATABASE_PORT:-3306}"; DATABASE_NAME="${DATABASE_NAME:-arunika_coffee_master_data}"; DATABASE_USER="${DATABASE_USER:-dev}"; DATABASE_PASSWORD="${DATABASE_PASSWORD:-dev123}"; DATABASE_URL="${DATABASE_URL:-mysql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}}"; export DATABASE_HOST DATABASE_PORT DATABASE_NAME DATABASE_USER DATABASE_PASSWORD DATABASE_URL
mysql_exec() { mysql --protocol=tcp --batch --skip-column-names -h "$DATABASE_HOST" -P "$DATABASE_PORT" -u "$DATABASE_USER" -p"$DATABASE_PASSWORD" -e "$1"; }
db_scalar() { mysql_exec "$1" 2>/dev/null | tr -d '\r' | tail -n 1; }
fk_exists() { [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='$1' AND COLUMN_NAME='$2' AND REFERENCED_TABLE_NAME='$3' AND REFERENCED_COLUMN_NAME='$4'")" == "1" ]]; }
fk_orphans() { [[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.\`$1\` c LEFT JOIN \`${DATABASE_NAME}\`.\`$3\` p ON c.\`$2\`=p.\`$4\` WHERE c.\`$2\` IS NOT NULL AND p.\`$4\` IS NULL")" == "0" ]]; }
column_contract() { [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='$1' AND COLUMN_NAME='$2' AND DATA_TYPE='$3' AND IS_NULLABLE='$4' AND IFNULL(COLUMN_DEFAULT,'<NULL>')='$5'")" == "1" ]]; }
section() { log ""; log "============================================================"; log "$1"; log "============================================================"; }

log "Arunika Coffee Master Data Service — Step 51-55 Verification"; log "Branch: $(git branch --show-current 2>/dev/null || echo UNKNOWN)"; log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo UNKNOWN)"; log "Database: ${DATABASE_NAME}@${DATABASE_HOST}:${DATABASE_PORT}"
section "PRECONDITIONS"
[[ "$(git branch --show-current 2>/dev/null || true)" == main ]] && pass "Git branch is main" || fail "Git branch must be main"
command_exists node && [[ "$(node -p 'process.versions.node.split(".")[0]')" == 22 ]] && pass "Node.js major version is 22" || fail "Node.js major version is 22"
command_exists mysql && pass "mysql CLI is available" || fail "mysql CLI is available"

section "STEP 51 — Coffee Bean Relationship Graph"
EXPECTED_FKS=('coffee_beans|regionId|regions|id' 'coffee_beans|farmerId|farmers|id' 'coffee_beans|farmId|farms|id' 'coffee_beans|speciesId|species|id' 'coffee_beans|varietyId|varieties|id' 'coffee_beans|processingMethodId|processing_methods|id' 'coffee_beans|gradeId|coffee_grades|id' 'coffee_beans|harvestSeasonId|harvest_seasons|id' 'farmers|regionId|regions|id' 'farms|farmerId|farmers|id' 'varieties|speciesId|species|id' 'sensory_profiles|coffeeBeanId|coffee_beans|id')
for fk in "${EXPECTED_FKS[@]}"; do IFS='|' read -r table col ref refcol <<< "$fk"; fk_exists "$table" "$col" "$ref" "$refcol" && pass "FK: $table.$col -> $ref.$refcol" || fail "Missing FK: $table.$col -> $ref.$refcol"; fk_orphans "$table" "$col" "$ref" "$refcol" && pass "No orphan FK rows: $table.$col" || fail "Orphan FK rows: $table.$col"; done
fk_exists regions countryId countries id && pass "Region -> Country FK" || fail "Region -> Country FK"; fk_exists organizations regionId regions id && pass "Organization -> Region FK" || fail "Organization -> Region FK"; fk_exists sensory_profile_flavors sensoryProfileId sensory_profiles id && pass "SensoryProfileFlavor -> SensoryProfile FK" || fail "SensoryProfileFlavor -> SensoryProfile FK"; fk_exists sensory_profile_flavors flavorProfileId flavor_profiles id && pass "SensoryProfileFlavor -> FlavorProfile FK" || fail "SensoryProfileFlavor -> FlavorProfile FK"

section "STEP 52 — Coffee Bean Quality & Inventory Semantics"
for pair in 'coffee_beans|cuppingScore|double|YES|<NULL>' 'coffee_beans|moisture|double|YES|<NULL>' 'coffee_beans|density|double|YES|<NULL>' 'coffee_beans|beanSize|varchar|YES|<NULL>' 'coffee_beans|qualityStatus|varchar|YES|<NULL>' 'coffee_beans|availableWeight|double|YES|<NULL>' 'coffee_beans|reservedWeight|double|YES|<NULL>' 'coffee_beans|weightUnit|varchar|NO|kg'; do IFS='|' read -r table column type nullable default <<< "$pair"; column_contract "$table" "$column" "$type" "$nullable" "$default" && pass "Column contract: $table.$column" || fail "Column contract: $table.$column"; done
[[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.coffee_beans WHERE availableWeight < 0 OR reservedWeight < 0")" == 0 ]] && pass "No negative inventory values" || fail "Negative inventory values exist"; [[ "$(db_scalar "SELECT COUNT(*) FROM \`${DATABASE_NAME}\`.coffee_beans WHERE availableWeight IS NOT NULL AND reservedWeight IS NOT NULL AND reservedWeight > availableWeight")" == 0 ]] && pass "reservedWeight <= availableWeight for populated rows" || fail "reservedWeight exceeds availableWeight"
if grep -R -nE 'cuppingScore.*(Min|Max|between|range)|moisture.*(Min|Max|between|range)|density.*(Min|Max|between|range)' src test 2>/dev/null; then fail "Quality fields contain uncontracted arbitrary ranges"; else pass "No uncontracted arbitrary quality ranges detected"; fi
if grep -R -nE 'qualityStatus.*enum|enum.*qualityStatus' prisma/schema src 2>/dev/null; then fail "qualityStatus was converted to an enum"; else pass "qualityStatus remains varchar/string semantics"; fi

section "STEP 53 — Master Data Lifecycle Semantics"
LIFECYCLE_TABLES="certifications coffee_beans coffee_grades countries farmers farms flavor_profiles harvest_seasons organizations processing_methods regions sensory_profiles species varieties"
for table in $LIFECYCLE_TABLES; do for column in isActive sortOrder createdAt updatedAt; do [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='$table' AND COLUMN_NAME='$column'")" == 1 ]] && pass "$table.$column exists" || fail "$table.$column missing"; done; done
for column in sortOrder createdAt updatedAt; do [[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='sensory_profile_flavors' AND COLUMN_NAME='$column'")" == 1 ]] && pass "sensory_profile_flavors.$column exists" || fail "sensory_profile_flavors.$column missing"; done
[[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND TABLE_NAME='sensory_profile_flavors' AND COLUMN_NAME='isActive'")" == 0 ]] && pass "sensory_profile_flavors correctly has no isActive" || fail "sensory_profile_flavors lifecycle contract mismatch"
if grep -R -nE '^\s*(deletedAt|deleted_at)\b' prisma/schema src test 2>/dev/null; then fail "deletedAt introduced"; else pass "No deletedAt lifecycle field introduced"; fi
if grep -R -nE '\bsoft[- ]delete|softDelete' src prisma/schema 2>/dev/null; then fail "Accidental soft-delete implementation detected"; else pass "No accidental soft-delete implementation detected"; fi
[[ "$(db_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DATABASE_NAME}' AND COLUMN_NAME='isActive'")" == 14 ]] && pass "All 14 lifecycle-managed entities expose isActive" || fail "Lifecycle isActive coverage mismatch"

section "STEP 54 — Prisma Schema Architecture"
run "Prisma schema validates" npx prisma validate; run "Prisma Client generates" npx prisma generate; run "Prisma migration status" npx prisma migrate status
[[ -f prisma.config.ts && -d prisma/schema ]] && pass "Prisma 7 config and split schema directory exist" || fail "Prisma schema composition files missing"
[[ "$(grep -R -lE '^model[[:space:]]+CoffeeBean([[:space:]]|\{)' prisma/schema | wc -l | tr -d ' ')" == 1 ]] && pass "CoffeeBean model defined once" || fail "CoffeeBean model definition count mismatch"
[[ "$(grep -R -lE '^model[[:space:]]+SensoryProfile([[:space:]]|\{)' prisma/schema | wc -l | tr -d ' ')" == 1 ]] && pass "SensoryProfile model defined once" || fail "SensoryProfile model definition count mismatch"
if grep -R -nE '^\s*(deletedAt|deleted_at)\b' prisma/schema; then fail "Prisma schema contains deletedAt"; else pass "Prisma schema contains no deletedAt"; fi

section "STEP 55 — Prisma / Repository Layer"
[[ -f src/infrastructure/database/prisma.service.ts ]] && pass "PrismaService exists" || fail "PrismaService missing"; [[ -f src/infrastructure/database/prisma-transaction.service.ts ]] && pass "Prisma transaction abstraction exists" || fail "Prisma transaction abstraction missing"; [[ -f src/infrastructure/database/repositories/prisma-base.repository.ts ]] && pass "Prisma base repository exists" || fail "Prisma base repository missing"
REPO_COUNT="$(find src/infrastructure/database/repositories -maxdepth 1 -name 'prisma-*.repository.ts' | wc -l | tr -d ' ')"; [[ "$REPO_COUNT" -ge 15 ]] && pass "Master-data Prisma repositories present ($REPO_COUNT)" || fail "Expected master-data repositories are incomplete ($REPO_COUNT)"
grep -q 'RepositoryUniqueConstraintError' src/infrastructure/database/repositories/prisma-base.repository.ts && pass "Unique constraint error translation exists" || fail "Unique constraint error translation missing"; grep -q 'RepositoryForeignKeyError' src/infrastructure/database/repositories/prisma-base.repository.ts && pass "Foreign-key error translation exists" || fail "Foreign-key error translation missing"; grep -q 'RepositoryNotFoundError' src/infrastructure/database/repositories/prisma-base.repository.ts && pass "Not-found error translation exists" || fail "Not-found error translation missing"; grep -q 'transactions.run' src/infrastructure/database/repositories/prisma-base.repository.ts && pass "Repository transaction boundary exists" || fail "Repository transaction boundary missing"
run "Repository unit/integrity tests" npx vitest run src/infrastructure/database/repositories; run "TypeScript typecheck" npm run typecheck; run "ESLint" npm run lint; run "Prettier check" npm run format:check; run "Test suite" npm test; run "Build" npm run build
section "FINAL ACCEPTANCE"; log "Assertions: ${TOTAL}"; log "Passed:    ${PASSED}"; log "Failed:    ${FAILED}"; [[ "$FAILED" -eq 0 ]] && { log "RESULT: PASS — Steps 51-55"; exit 0; }; log "RESULT: FAIL — Steps 51-55"; exit 1