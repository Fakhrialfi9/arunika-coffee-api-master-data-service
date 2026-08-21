#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
REPORT_FILE="${REPORT_FILE:-tmp/steps-56-60-report.txt}"
mkdir -p "$(dirname "$REPORT_FILE")"
: > "$REPORT_FILE"
TOTAL=0
PASSED=0
FAILED=0

log() { printf '%s\n' "$*" | tee -a "$REPORT_FILE"; }
pass() { TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1)); log "PASS  $*"; }
fail() { TOTAL=$((TOTAL + 1)); FAILED=$((FAILED + 1)); log "FAIL  $*"; }
run() {
  local label="$1"
  shift
  if "$@" >>"$REPORT_FILE" 2>&1; then pass "$label"; else fail "$label"; fi
}
section() {
  log ""
  log "============================================================"
  log "$1"
  log "============================================================"
}
has() { [[ -e "$1" ]]; }
model_exists() {
  grep -R -qE "^model[[:space:]]+$1([[:space:]]|\{)" prisma/schema
}
crud_exists() {
  [[ -f "src/application/master-data/$1/$1-crud.use-case.ts" ]]
}
field_exists() {
  grep -R -qE "^[[:space:]]*$2[[:space:]]" "$1"
}
relation_exists() {
  grep -R -qE "^[[:space:]]*$2[[:space:]]+.*@relation\(fields:[[:space:]]*\[$3\]" "$1"
}

log "Arunika Coffee Master Data Service — Step 56-60 Verification"
log "Branch: $(git branch --show-current 2>/dev/null || echo UNKNOWN)"
log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo UNKNOWN)"

section "PRECONDITIONS"
[[ "$(git branch --show-current 2>/dev/null || true)" == "main" ]] && pass "Git branch is main" || fail "Git branch is not main"
command -v node >/dev/null 2>&1 && [[ "$(node -p 'process.versions.node.split(".")[0]')" == "22" ]] && pass "Node.js 22" || fail "Node.js 22 required"
command -v npm >/dev/null 2>&1 && pass "npm available" || fail "npm unavailable"
has package.json && pass "package.json exists" || fail "package.json missing"

section "DATABASE CONTRACT"
run "Prisma validate" npx prisma validate
run "Prisma generate" npx prisma generate
for model in Country Region Organization Farmer Farm Species Variety ProcessingMethod CoffeeGrade HarvestSeason Certifications FlavorProfiles CoffeeBean; do
  model_exists "$model" && pass "Prisma model: $model" || fail "Prisma model missing: $model"
done
for forbidden in deletedAt deleted_at; do
  grep -R -qE "^[[:space:]]*$forbidden([[:space:]]|$)" prisma/schema && fail "Forbidden lifecycle field: $forbidden" || pass "No forbidden lifecycle field: $forbidden"
done

section "STEP 56 — DOMAIN LAYER"
for file in \
  src/domain/country/entities/country.entity.ts \
  src/domain/region/entities/region.entity.ts \
  src/domain/coffee-beans/entities/coffee-bean.entity.ts \
  src/domain/species/entities/species.entity.ts \
  src/domain/varieties/entities/variety.entity.ts \
  src/domain/certifications/entities/certification.entity.ts; do
  has "$file" && pass "Domain entity: $file" || fail "Domain entity missing: $file"
done
find src/domain -type f -name '*.ts' -print0 | xargs -0 grep -nE '(@prisma/client|prisma/generated/prisma|PrismaClient|Prisma\.)' >/dev/null 2>&1 && fail "Prisma dependency leaked into domain" || pass "Domain is independent from Prisma"
find src/domain -type f -name '*repository*.ts' | grep -q . && pass "Repository contracts exist" || fail "Repository contracts missing"
[[ -f src/domain/shared/repositories/master-data.repository.ts ]] && pass "Shared repository boundary exists" || fail "Shared repository boundary missing"
[[ -f src/application/master-data/mappers/master-data.mapper.ts ]] && pass "Mapping boundary exists" || fail "Mapping boundary missing"
run "Domain tests" npx vitest run src/domain

section "STEP 57 — APPLICATION LAYER"
[[ -d src/application ]] && pass "Application layer exists" || fail "Application layer missing"
for dir in commands queries use-cases services dto; do
  [[ -d "src/application/master-data/$dir" ]] && pass "Application $dir boundary exists" || fail "Application $dir boundary missing"
done
find src/application -type f -name '*.ts' -print0 | xargs -0 grep -nE '(@prisma/client|prisma/generated/prisma|PrismaClient|Prisma\.)' >/dev/null 2>&1 && fail "Prisma dependency leaked into application" || pass "Application has no direct Prisma dependency"
grep -R -q 'MASTER_DATA_REPOSITORY_FACTORY' src/application && pass "Application consumes repository abstraction" || fail "Repository abstraction not consumed"
run "Application tests" npx vitest run src/application

section "STEP 58 — CORE MASTER DATA CRUD I"
for pair in \
  'country:Country' \
  'region:Region' \
  'organization:Organization' \
  'farmer:Farmer' \
  'farm:Farm'; do
  IFS=':' read -r dir entity <<< "$pair"
  crud_exists "$dir" && pass "$entity CRUD boundary" || fail "$entity CRUD boundary missing"
done
field_exists prisma/schema/region.prisma countryId && pass "FK contract: regions.countryId" || fail "FK contract missing: regions.countryId"
field_exists prisma/schema/organization.prisma regionId && pass "FK contract: organizations.regionId" || fail "FK contract missing: organizations.regionId"
field_exists prisma/schema/farmer.prisma regionId && pass "FK contract: farmers.regionId" || fail "FK contract missing: farmers.regionId"
field_exists prisma/schema/farmer.prisma organizationId && pass "FK contract: farmers.organizationId" || fail "FK contract missing: farmers.organizationId"
field_exists prisma/schema/farm.prisma farmerId && pass "FK contract: farms.farmerId" || fail "FK contract missing: farms.farmerId"
for op in create get list update delete; do
  grep -R -q "${op}(" src/application/master-data/services/master-data-crud.service.ts && pass "Generic CRUD operation: $op" || fail "CRUD operation missing: $op"
done

section "STEP 59 — CORE MASTER DATA CRUD II"
for pair in \
  'species:Species' \
  'variety:Variety' \
  'processing-method:ProcessingMethod' \
  'coffee-grade:CoffeeGrade' \
  'harvest-season:HarvestSeason' \
  'certification:Certification' \
  'flavor-profile:FlavorProfile'; do
  IFS=':' read -r dir entity <<< "$pair"
  crud_exists "$dir" && pass "$entity CRUD boundary" || fail "$entity CRUD boundary missing"
done
grep -R -nE 'speciesId.*variety|variety.*speciesId|Species.*Variety' src/application src/domain prisma/schema >/dev/null 2>&1 && pass "Species -> Variety integrity" || fail "Species -> Variety integrity missing"
grep -R -nE 'processingSteps|parameters|plantCharacteristics|flavorCharacteristics' prisma/schema >/dev/null 2>&1 && pass "Required JSON mappings exist" || fail "Required JSON mappings missing"

section "STEP 60 — COFFEE BEAN CRUD"
[[ -f src/domain/coffee-beans/entities/coffee-bean.entity.ts ]] && pass "CoffeeBean domain entity" || fail "CoffeeBean domain entity missing"
[[ -f src/application/master-data/coffee-bean/coffee-bean-crud.use-case.ts ]] && pass "CoffeeBean CRUD boundary" || fail "CoffeeBean CRUD boundary missing"
for field in uuid code regionId farmerId farmId speciesId varietyId processingMethodId gradeId harvestSeasonId flavorProfiles aromaNotes availableWeight reservedWeight weightUnit isFeatured isActive sortOrder; do
  grep -R -qE "^[[:space:]]*$field[[:space:]]" prisma/schema/coffee-bean.prisma && pass "CoffeeBean field: $field" || fail "CoffeeBean field missing: $field"
done
grep -R -q 'Species/Variety' src/application/master-data/services/master-data-crud.service.ts && pass "Species/Variety consistency" || fail "Species/Variety consistency missing"
grep -R -q 'Farmer/Farm' src/application/master-data/services/master-data-crud.service.ts && pass "Farmer/Farm consistency" || fail "Farmer/Farm consistency missing"
grep -R -q 'flavorProfiles.*Json\|aromaNotes.*Json' prisma/schema/coffee-bean.prisma && pass "CoffeeBean JSON contract preserved" || fail "CoffeeBean JSON contract missing"

section "REGRESSION — STEPS 26-55"
[[ -f scripts/verify-steps-26-45-v2.sh ]] && pass "26-45 verifier retained" || fail "26-45 verifier missing"
[[ -f scripts/verify-steps-51-55.sh ]] && pass "51-55 verifier retained" || fail "51-55 verifier missing"
run "Regression verifier 51-55" bash scripts/verify-steps-51-55.sh

section "GLOBAL QUALITY GATE"
run "Typecheck" npm run typecheck
run "ESLint" npm run lint
run "Prettier check" npm run format:check
run "Unit/full tests" npm test
run "Build" npm run build
run "Git diff check" git diff --check

section "FINAL ACCEPTANCE"
log "Assertions: $TOTAL"
log "Passed: $PASSED"
log "Failed: $FAILED"
if [[ "$FAILED" -eq 0 ]]; then
  log "RESULT: PASS — Steps 56-60"
  exit 0
fi
log "RESULT: NOT PASS — Steps 56-60"
exit 1
