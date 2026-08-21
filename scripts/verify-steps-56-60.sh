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
command_exists() { command -v "$1" >/dev/null 2>&1; }

has_file() { [[ -f "$1" ]]; }
count_files() { find "$1" -type f -name "$2" 2>/dev/null | wc -l | tr -d ' '; }
contains() { grep -R -nE "$1" "$2" >/dev/null 2>&1; }

section() {
  log ""
  log "============================================================"
  log "$1"
  log "============================================================"
}

log "Arunika Coffee Master Data Service — Step 56-60 Verification"
log "Branch: $(git branch --show-current 2>/dev/null || echo UNKNOWN)"
log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo UNKNOWN)"

section "PRECONDITIONS"
[[ "$(git branch --show-current 2>/dev/null || true)" == "main" ]] && pass "Git branch is main" || fail "Git branch must be main"
command_exists node && [[ "$(node -p 'process.versions.node.split(\".\")[0]')" == "22" ]] && pass "Node.js major version is 22" || fail "Node.js major version is 22"
command_exists npm && pass "npm is available" || fail "npm is available"
[[ -f package.json ]] && pass "package.json exists" || fail "package.json missing"
[[ -d prisma/schema ]] && pass "Split Prisma schema directory exists" || fail "prisma/schema missing"

section "DATABASE / PRISMA CONTRACT"
run "Prisma schema validation" npx prisma validate
run "Prisma Client generation" npx prisma generate

for model in Country Region Organization Farmer Farm Species Variety ProcessingMethod CoffeeGrade HarvestSeason Certification FlavorProfile CoffeeBean; do
  if grep -R -qE "^model[[:space:]]+${model}([[:space:]]|\{)" prisma/schema; then
    pass "Prisma model exists: $model"
  else
    fail "Prisma model missing: $model"
  fi
done

for forbidden in 'deletedAt' 'deleted_at'; do
  if grep -R -nE "^[[:space:]]*${forbidden}([[:space:]]|$)" prisma/schema >/dev/null 2>&1; then
    fail "Forbidden lifecycle field detected: $forbidden"
  else
    pass "No forbidden lifecycle field: $forbidden"
  fi
done

section "STEP 56 — DOMAIN LAYER"
[[ -d src/domain ]] && pass "Domain layer exists" || fail "Domain layer missing"

DOMAIN_FILES=(
  "src/domain/certifications/entities/certification.entity.ts"
  "src/domain/coffee-grades/entities/coffee-grade.entity.ts"
  "src/domain/farmers/entities/farmer.entity.ts"
  "src/domain/farms/entities/farm.entity.ts"
  "src/domain/flavor-profiles/entities/flavor-profile.entity.ts"
  "src/domain/harvest-seasons/entities/harvest-season.entity.ts"
  "src/domain/organizations/entities/organization.entity.ts"
  "src/domain/processing-methods/entities/processing-method.entity.ts"
  "src/domain/species/entities/species.entity.ts"
  "src/domain/varieties/entities/variety.entity.ts"
)
for file in "${DOMAIN_FILES[@]}"; do
  has_file "$file" && pass "Domain entity exists: $file" || fail "Domain entity missing: $file"
done

for file in $(find src/domain -type f -name '*.ts' 2>/dev/null); do
  if grep -nE "(@prisma/client|prisma/generated/prisma|PrismaClient|Prisma\.)" "$file" >/dev/null 2>&1; then
    fail "Prisma dependency leaks into domain: $file"
  fi
done
pass "Domain Prisma-independence scan completed"

if find src/domain -type f -name '*repository*.ts' -o -name '*repositories*.ts' 2>/dev/null | grep -q .; then
  pass "Domain repository contract files are present"
else
  fail "Domain repository contracts are missing"
fi

if [[ -d src/domain/mapping || -d src/domain/mappers || -d src/application/mappers ]]; then
  pass "Domain/application mapping boundary exists"
else
  fail "Explicit domain/persistence mapping boundary missing"
fi

run "Domain unit tests" npx vitest run src/domain

section "STEP 57 — APPLICATION LAYER"
[[ -d src/application ]] && pass "Application layer exists" || fail "Application layer missing"

for dir in commands queries use-cases; do
  if [[ -d "src/application/$dir" ]]; then pass "Application sub-layer exists: $dir"; else fail "Application sub-layer missing: $dir"; fi
done

if [[ -d src/application ]] && ! grep -R -nE '(@prisma/client|prisma/generated/prisma|PrismaClient|Prisma\.)' src/application >/dev/null 2>&1; then
  pass "Application layer has no direct Prisma dependency"
else
  fail "Application layer directly depends on Prisma or is missing"
fi

if grep -R -nE 'constructor\([^)]*Repository|@Inject\([^)]*Repository|Repository<' src/application >/dev/null 2>&1; then
  pass "Application layer consumes repository abstractions"
else
  fail "Application repository abstraction usage not detected"
fi

run "Application/domain tests" npx vitest run src/application

section "STEP 58 — CORE MASTER DATA CRUD I"
for entity in Country Region Organization Farmer Farm; do
  found=0
  for pattern in "${entity,,}" "$(printf '%s' "$entity" | sed 's/\([A-Z]\)/-\L\1/g;s/^-//')"; do
    if find src -type f \( -iname "*${pattern}*create*.ts" -o -iname "*${pattern}*update*.ts" -o -iname "*${pattern}*delete*.ts" \) 2>/dev/null | grep -q .; then found=1; break; fi
  done
  [[ "$found" == 1 ]] && pass "$entity CRUD use-case files detected" || fail "$entity CRUD use-case files missing"
done

for rel in \
  'regions.*countryId' \
  'organizations.*regionId' \
  'farmers.*regionId' \
  'farmers.*organizationId' \
  'farms.*farmerId'; do
  if grep -R -nE "$rel" prisma/schema >/dev/null 2>&1; then pass "Schema relationship contract detected: $rel"; else fail "Schema relationship contract missing: $rel"; fi
done

section "STEP 59 — CORE MASTER DATA CRUD II"
for entity in Species Variety ProcessingMethod CoffeeGrade HarvestSeason Certification FlavorProfile; do
  found=0
  pattern="$(printf '%s' "$entity" | sed 's/\([A-Z]\)/-\L\1/g;s/^-//')"
  if find src -type f -iname "*${pattern}*" 2>/dev/null | grep -q .; then found=1; fi
  [[ "$found" == 1 ]] && pass "$entity implementation files detected" || fail "$entity implementation files missing"
done

if grep -R -nE 'variet(y|ies).*speciesId|speciesId.*variet(y|ies)' prisma/schema >/dev/null 2>&1; then
  pass "Species -> Variety contract detected"
else
  fail "Species -> Variety contract missing"
fi

if grep -R -nE 'Json|json' prisma/schema | grep -E 'plantCharacteristics|flavorCharacteristics|processingSteps|parameters' >/dev/null 2>&1; then
  pass "Required JSON persistence fields detected"
else
  fail "Required JSON persistence fields not detected"
fi

section "STEP 60 — COFFEE BEAN CRUD"
if grep -R -nE '^model[[:space:]]+CoffeeBean([[:space:]]|\{)' prisma/schema >/dev/null 2>&1; then pass "CoffeeBean Prisma model detected"; else fail "CoffeeBean Prisma model missing"; fi

COFFEE_FIELDS=(uuid code regionId farmerId farmId speciesId varietyId processingMethodId gradeId harvestSeasonId flavorProfiles aromaNotes availableWeight reservedWeight weightUnit isFeatured isActive sortOrder)
for field in "${COFFEE_FIELDS[@]}"; do
  if grep -R -nE "^[[:space:]]*${field}[[:space:]]" prisma/schema/coffee-bean.prisma prisma/schema 2>/dev/null | grep -q .; then
    pass "CoffeeBean field contract: $field"
  else
    fail "CoffeeBean field missing: $field"
  fi
done

for relation in regionId farmerId farmId speciesId varietyId processingMethodId gradeId harvestSeasonId; do
  if grep -R -nE "^[[:space:]]*${relation}[[:space:]]" prisma/schema/coffee-bean.prisma 2>/dev/null | grep -q .; then pass "CoffeeBean dependency field: $relation"; else fail "CoffeeBean dependency field missing: $relation"; fi
done

if grep -R -nE 'flavorProfiles[[:space:]]+Json|aromaNotes[[:space:]]+Json' prisma/schema/coffee-bean.prisma prisma/schema 2>/dev/null >/dev/null; then
  pass "CoffeeBean JSON fields remain JSON"
else
  fail "CoffeeBean JSON field contract missing"
fi

if grep -R -nE 'speciesId.*varietyId|varietyId.*speciesId|Species.*Variety' src/application src/domain 2>/dev/null >/dev/null; then
  pass "Species/Variety consistency logic detected"
else
  fail "Species/Variety consistency logic not detected"
fi

if grep -R -nE 'farmId.*farmerId|farmerId.*farmId|Farmer.*Farm' src/application src/domain 2>/dev/null >/dev/null; then
  pass "Farmer/Farm consistency logic detected"
else
  fail "Farmer/Farm consistency logic not detected"
fi

for operation in create get list update delete; do
  if find src -type f \( -iname "*coffee*bean*${operation}*.ts" -o -iname "*coffee-bean*${operation}*.ts" \) 2>/dev/null | grep -q .; then
    pass "CoffeeBean $operation use case detected"
  else
    fail "CoffeeBean $operation use case missing"
  fi
done

section "REGRESSION — STEPS 26-55"
[[ -f scripts/verify-steps-26-45-v2.sh ]] && pass "Steps 26-45 verifier remains present" || fail "Steps 26-45 verifier missing"
[[ -f scripts/verify-steps-51-55.sh ]] && pass "Steps 51-55 verifier remains present" || fail "Steps 51-55 verifier missing"
run "Previous batch verifier: Steps 51-55" bash scripts/verify-steps-51-55.sh

section "GLOBAL QUALITY GATE"
run "TypeScript typecheck" npm run typecheck
run "ESLint" npm run lint
run "Prettier check" npm run format:check
run "Full test suite" npm test
run "Build" npm run build

section "FINAL ACCEPTANCE"
log "Assertions: $TOTAL"
log "Passed:    $PASSED"
log "Failed:    $FAILED"
if [[ "$FAILED" -eq 0 ]]; then
  log "RESULT: PASS — Steps 56-60"
  exit 0
fi
log "RESULT: NOT PASS — Steps 56-60"
exit 1
