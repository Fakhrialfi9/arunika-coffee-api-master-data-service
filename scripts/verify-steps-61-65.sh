#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
REPORT_FILE="${REPORT_FILE:-tmp/steps-61-65-report.txt}"
mkdir -p "$(dirname "$REPORT_FILE")"
: > "$REPORT_FILE"
TOTAL=0
PASSED=0
FAILED=0

log() { printf '%s\n' "$*" | tee -a "$REPORT_FILE"; }
pass() { TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1)); log "PASS  $*"; }
fail() { TOTAL=$((TOTAL + 1)); FAILED=$((FAILED + 1)); log "FAIL  $*"; }
run() { local label="$1"; shift; if "$@" >>"$REPORT_FILE" 2>&1; then pass "$label"; else fail "$label"; fi }
has() { [[ -e "$1" ]]; }
contains() { grep -R -F -q -- "$2" "$1"; }
section() { log ""; log "============================================================"; log "$1"; log "============================================================"; }

log "Arunika Coffee Master Data Service — Step 61-65 Verification"
log "Branch: $(git branch --show-current 2>/dev/null || echo UNKNOWN)"
log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo UNKNOWN)"

section "PRECONDITIONS"
[[ "$(git branch --show-current 2>/dev/null || true)" == "main" ]] && pass "Git branch is main" || fail "Git branch is not main"
command -v node >/dev/null 2>&1 && pass "Node available" || fail "Node unavailable"
command -v npm >/dev/null 2>&1 && pass "npm available" || fail "npm unavailable"

section "STEP 61 — SENSORY DATA CRUD"
has prisma/schema/sensory-profile.prisma && pass "SensoryProfile schema" || fail "SensoryProfile schema missing"
has prisma/schema/sensory-profile-flavor.prisma && pass "SensoryProfileFlavor schema" || fail "SensoryProfileFlavor schema missing"
has src/infrastructure/database/repositories/prisma-sensory-profile.repository.ts && pass "SensoryProfile repository" || fail "SensoryProfile repository missing"
has src/infrastructure/database/repositories/prisma-sensory-profile-flavor.repository.ts && pass "SensoryProfileFlavor repository" || fail "SensoryProfileFlavor repository missing"
has src/application/master-data/services/sensory-profile-mapping.service.ts && pass "Sensory mapping application service" || fail "Sensory mapping application service missing"
contains src/domain/shared/repositories/master-data.repository.ts "sensoryProfile" && pass "SensoryProfile CRUD registered" || fail "SensoryProfile CRUD not registered"
contains src/domain/shared/repositories/master-data.repository.ts "sensoryProfileFlavor" && pass "SensoryProfileFlavor CRUD registered" || fail "SensoryProfileFlavor CRUD not registered"
contains src/application/master-data/services/master-data-crud.service.ts "coffeeBeanId" && pass "SensoryProfile coffeeBean FK validation" || fail "SensoryProfile coffeeBean FK validation missing"
contains prisma/schema/sensory-profile.prisma "coffeeBeanId String @unique" && pass "SensoryProfile coffeeBeanId uniqueness" || fail "SensoryProfile coffeeBeanId uniqueness missing"
contains prisma/schema/sensory-profile-flavor.prisma "@@unique([sensoryProfileId, flavorProfileId])" && pass "Duplicate mapping DB constraint" || fail "Duplicate mapping constraint missing"
contains src/infrastructure/database/repositories/prisma-sensory-profile-flavor.repository.ts "replaceForProfile" && pass "Atomic mapping replacement" || fail "Atomic mapping replacement missing"
contains src/infrastructure/database/repositories/prisma-sensory-profile-flavor.repository.ts "removeMapping" && pass "Mapping removal" || fail "Mapping removal missing"
contains src/infrastructure/database/repositories/prisma-sensory-profile-flavor.repository.ts "sortOrder" && pass "Mapping sortOrder handling" || fail "Mapping sortOrder handling missing"

section "STEP 62 — CROSS-DOMAIN USE CASES"
has src/application/master-data/services/master-data-relationship.service.ts && pass "Cross-domain relationship application service" || fail "Cross-domain relationship service missing"
for relation in region farmer farm species variety processingMethod grade harvestSeason sensoryProfile; do
  contains src/application/master-data/services/master-data-relationship.service.ts "$relation" && pass "CoffeeBean -> $relation query path" || fail "CoffeeBean -> $relation query path missing"
done
contains src/application/master-data/services/master-data-crud.service.ts "varietyId must belong to the selected speciesId" && pass "Species/Variety invariant" || fail "Species/Variety invariant missing"
contains src/application/master-data/services/master-data-crud.service.ts "farmId must belong to farmerId" && pass "Farmer/Farm invariant" || fail "Farmer/Farm invariant missing"
contains src/application/master-data/services/master-data-crud.service.ts "farmerId must belong to regionId" && pass "Farmer/Region invariant" || fail "Farmer/Region invariant missing"

section "STEP 63 — FILTERING / SEARCHING / PAGINATION"
contains src/domain/shared/repositories/master-data.repository.ts "filters?" && pass "Filter contract" || fail "Filter contract missing"
contains src/infrastructure/database/repositories/prisma-master-data-repository.factory.ts "SEARCH_FIELDS" && pass "Entity search whitelist" || fail "Search whitelist missing"
contains src/infrastructure/database/repositories/prisma-master-data-repository.factory.ts "orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }]" && pass "Deterministic sorting" || fail "Deterministic sorting missing"
contains src/application/master-data/services/master-data-crud.service.ts "limit must be an integer between 1 and 100" && pass "Pagination max validation" || fail "Pagination max validation missing"
contains src/application/master-data/services/master-data-crud.service.ts "Unsupported master-data sort field" && pass "Sort field validation" || fail "Sort field validation missing"
contains src/application/master-data/services/master-data-crud.service.ts "Unsupported master-data filter" && pass "Filter field validation" || fail "Filter field validation missing"
contains src/infrastructure/database/repositories/prisma-master-data-repository.factory.ts "contains: search" && pass "Parameterized Prisma search" || fail "Search query implementation missing"

section "STEP 64 — RELATIONSHIP QUERIES"
contains src/application/master-data/services/master-data-relationship.service.ts "countryRegions" && pass "Country -> Regions" || fail "Country -> Regions missing"
contains src/application/master-data/services/master-data-relationship.service.ts "regionFarmers" && pass "Region -> Farmers" || fail "Region -> Farmers missing"
contains src/application/master-data/services/master-data-relationship.service.ts "farmerFarms" && pass "Farmer -> Farms" || fail "Farmer -> Farms missing"
contains src/application/master-data/services/master-data-relationship.service.ts "speciesVarieties" && pass "Species -> Varieties" || fail "Species -> Varieties missing"
contains src/application/master-data/services/master-data-relationship.service.ts "coffeeBeanMetadata" && pass "CoffeeBean -> metadata" || fail "CoffeeBean metadata query missing"
contains src/application/master-data/services/master-data-relationship.service.ts "sensoryFlavors" && pass "SensoryProfile -> Flavors" || fail "SensoryProfile -> Flavors missing"
contains src/application/master-data/services/master-data-relationship.service.ts "sortOrder: 'asc'" && pass "Relationship ordering" || fail "Relationship ordering missing"
contains src/application/master-data/services/master-data-relationship.service.ts "include: { flavorProfile: true }" && pass "Flavor mapping DTO graph" || fail "Flavor mapping relation missing"

section "STEP 65 — VALIDATION & BUSINESS RULES"
contains src/application/master-data/services/master-data-crud.service.ts "is required" && pass "Required FK validation" || fail "Required FK validation missing"
contains src/infrastructure/database/repositories/prisma-base.repository.ts "P2002" && pass "Unique DB error mapping" || fail "Unique DB error mapping missing"
contains src/infrastructure/database/repositories/prisma-base.repository.ts "P2003" && pass "FK DB error mapping" || fail "FK DB error mapping missing"
contains src/application/master-data/services/master-data-crud.service.ts "between 1 and 12" && pass "Month validation" || fail "Month validation missing"
contains src/application/master-data/services/master-data-crud.service.ts "valid year" && pass "Year validation" || fail "Year validation missing"
contains src/application/master-data/services/master-data-crud.service.ts "latitude must be between -90 and 90" && pass "Latitude validation" || fail "Latitude validation missing"
contains src/application/master-data/services/master-data-crud.service.ts "longitude must be between -180 and 180" && pass "Longitude validation" || fail "Longitude validation missing"
contains src/application/master-data/services/master-data-crud.service.ts "non-negative" && pass "Non-negative numeric validation" || fail "Non-negative numeric validation missing"

section "DATABASE CONTRACT"
run "Prisma validate" npx prisma validate
run "Prisma generate" npx prisma generate
for forbidden in deletedAt deleted_at; do
  grep -R -qE "^[[:space:]]*$forbidden([[:space:]]|$)" prisma/schema && fail "Forbidden lifecycle field: $forbidden" || pass "No forbidden lifecycle field: $forbidden"
done

section "REGRESSION — STEPS 26-60"
run "Regression verifier 56-60" bash scripts/verify-steps-56-60.sh

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
  log "RESULT: PASS — Steps 61-65"
  exit 0
fi
log "RESULT: NOT PASS — Steps 61-65"
exit 1
