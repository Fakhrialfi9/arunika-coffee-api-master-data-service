#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT_DIR"
REPORT_FILE="${REPORT_FILE:-tmp/steps-56-60-report.txt}"; mkdir -p "$(dirname "$REPORT_FILE")"; : > "$REPORT_FILE"
TOTAL=0; PASSED=0; FAILED=0
log(){ printf '%s\n' "$*" | tee -a "$REPORT_FILE"; }
pass(){ TOTAL=$((TOTAL+1)); PASSED=$((PASSED+1)); log "PASS  $*"; }
fail(){ TOTAL=$((TOTAL+1)); FAILED=$((FAILED+1)); log "FAIL  $*"; }
run(){ local label="$1"; shift; if "$@" >>"$REPORT_FILE" 2>&1; then pass "$label"; else fail "$label"; fi; }
section(){ log "\n============================================================\n$1\n============================================================"; }
has(){ [[ -e "$1" ]]; }

log "Arunika Coffee Master Data Service — Step 56-60 Verification"
log "Branch: $(git branch --show-current 2>/dev/null || echo UNKNOWN)"
log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo UNKNOWN)"

section "PRECONDITIONS"
[[ "$(git branch --show-current 2>/dev/null || true)" == "main" ]] && pass "Git branch is main" || fail "Git branch is not main"
command -v node >/dev/null 2>&1 && [[ "$(node -p 'process.versions.node.split(\".\")[0]')" == "22" ]] && pass "Node.js 22" || fail "Node.js 22 required"
command -v npm >/dev/null 2>&1 && pass "npm available" || fail "npm unavailable"
has package.json && pass "package.json exists" || fail "package.json missing"

section "DATABASE CONTRACT"
run "Prisma validate" npx prisma validate
run "Prisma generate" npx prisma generate
for model in Country Region Organization Farmer Farm Species Variety ProcessingMethod CoffeeGrade HarvestSeason Certification FlavorProfile CoffeeBean; do grep -R -qE "^model[[:space:]]+$model([[:space:]]|\{)" prisma/schema && pass "Prisma model: $model" || fail "Prisma model missing: $model"; done
for forbidden in deletedAt deleted_at; do grep -R -qE "^[[:space:]]*$forbidden([[:space:]]|$)" prisma/schema && fail "Forbidden lifecycle field: $forbidden" || pass "No forbidden lifecycle field: $forbidden"; done

section "STEP 56 — DOMAIN LAYER"
for file in \
  src/domain/country/entities/country.entity.ts \
  src/domain/region/entities/region.entity.ts \
  src/domain/coffee-beans/entities/coffee-bean.entity.ts \
  src/domain/species/entities/species.entity.ts \
  src/domain/varieties/entities/variety.entity.ts \
  src/domain/certifications/entities/certification.entity.ts; do has "$file" && pass "Domain entity: $file" || fail "Domain entity missing: $file"; done
find src/domain -type f -name '*.ts' -print0 | xargs -0 grep -nE '(@prisma/client|prisma/generated/prisma|PrismaClient|Prisma\.)' >/dev/null 2>&1 && fail "Prisma dependency leaked into domain" || pass "Domain is independent from Prisma"
find src/domain -type f -name '*repository*.ts' | grep -q . && pass "Repository contracts exist" || fail "Repository contracts missing"
[[ -f src/domain/shared/repositories/master-data.repository.ts ]] && pass "Shared repository boundary exists" || fail "Shared repository boundary missing"
[[ -f src/application/master-data/mappers/master-data.mapper.ts ]] && pass "Mapping boundary exists" || fail "Mapping boundary missing"
run "Domain tests" npx vitest run src/domain

section "STEP 57 — APPLICATION LAYER"
[[ -d src/application ]] && pass "Application layer exists" || fail "Application layer missing"
for dir in commands queries use-cases services dto; do [[ -d "src/application/master-data/$dir" ]] && pass "Application $dir boundary exists" || fail "Application $dir boundary missing"; done
find src/application -type f -name '*.ts' -print0 | xargs -0 grep -nE '(@prisma/client|prisma/generated/prisma|PrismaClient|Prisma\.)' >/dev/null 2>&1 && fail "Prisma dependency leaked into application" || pass "Application has no direct Prisma dependency"
grep -R -q 'MASTER_DATA_REPOSITORY_FACTORY' src/application && pass "Application consumes repository abstraction" || fail "Repository abstraction not consumed"
run "Application tests" npx vitest run src/application

section "STEP 58 — CORE MASTER DATA CRUD I"
for entity in Country Region Organization Farmer Farm; do find src/application/master-data -type f -iname "*${entity,,}*crud*.use-case.ts" | grep -q . && pass "$entity CRUD boundary" || fail "$entity CRUD boundary missing"; done
for rel in 'regions.*countryId' 'organizations.*regionId' 'farmers.*regionId' 'farmers.*organizationId' 'farms.*farmerId'; do grep -R -nE "$rel" prisma/schema >/dev/null 2>&1 && pass "FK contract: $rel" || fail "FK contract missing: $rel"; done
for op in create get list update delete; do grep -R -q "${op}(" src/application/master-data/services/master-data-crud.service.ts && pass "Generic CRUD operation: $op" || fail "CRUD operation missing: $op"; done

section "STEP 59 — CORE MASTER DATA CRUD II"
for entity in Species Variety ProcessingMethod CoffeeGrade HarvestSeason Certification FlavorProfile; do find src/application/master-data -type f -iname "*${entity,,}*crud*.use-case.ts" | grep -q . && pass "$entity CRUD boundary" || fail "$entity CRUD boundary missing"; done
grep -R -nE 'speciesId.*variety|variety.*speciesId|Species.*Variety' src/application src/domain prisma/schema >/dev/null 2>&1 && pass "Species -> Variety integrity" || fail "Species -> Variety integrity missing"
grep -R -nE 'processingSteps|parameters|plantCharacteristics|flavorCharacteristics' prisma/schema >/dev/null 2>&1 && pass "Required JSON mappings exist" || fail "Required JSON mappings missing"

section "STEP 60 — COFFEE BEAN CRUD"
[[ -f src/domain/coffee-beans/entities/coffee-bean.entity.ts ]] && pass "CoffeeBean domain entity" || fail "CoffeeBean domain entity missing"
[[ -f src/application/master-data/coffee-bean/coffee-bean-crud.use-case.ts ]] && pass "CoffeeBean CRUD boundary" || fail "CoffeeBean CRUD boundary missing"
for field in uuid code regionId farmerId farmId speciesId varietyId processingMethodId gradeId harvestSeasonId flavorProfiles aromaNotes availableWeight reservedWeight weightUnit isFeatured isActive sortOrder; do grep -R -qE "^[[:space:]]*$field[[:space:]]" prisma/schema/coffee-bean.prisma && pass "CoffeeBean field: $field" || fail "CoffeeBean field missing: $field"; done
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
if [[ "$FAILED" -eq 0 ]]; then log "RESULT: PASS — Steps 56-60"; exit 0; fi
log "RESULT: NOT PASS — Steps 56-60"; exit 1
