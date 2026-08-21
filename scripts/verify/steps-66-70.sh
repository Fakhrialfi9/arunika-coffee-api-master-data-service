#!/usr/bin/env bash
set -uo pipefail

# Verification gate for PHASE 2 / Steps 66-70.
# Read-only by default. Seed repeatability requires VERIFY_ALLOW_SEED_MUTATION=true
# and a test database whose name ends with _test.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

pass() { printf '  [PASS] %s\n' "$1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { printf '  [FAIL] %s\n' "$1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
skip() { printf '  [SKIP] %s\n' "$1"; SKIP_COUNT=$((SKIP_COUNT + 1)); }
section() { printf '\n=== %s ===\n' "$1"; }

run_required() {
  local label="$1"; shift
  printf '  [RUN ] %s\n' "$label"
  if "$@"; then pass "$label"; else fail "$label"; fi
}

file_nonempty() { [[ -s "$1" ]]; }
command_exists() { command -v "$1" >/dev/null 2>&1; }

MYSQL_ARGS=()
if [[ -n "${DATABASE_HOST:-}" ]]; then MYSQL_ARGS+=(--host="$DATABASE_HOST"); fi
if [[ -n "${DATABASE_PORT:-}" ]]; then MYSQL_ARGS+=(--port="$DATABASE_PORT"); fi
if [[ -n "${DATABASE_USER:-}" ]]; then MYSQL_ARGS+=(--user="$DATABASE_USER"); fi
if [[ -n "${DATABASE_PASSWORD:-}" ]]; then MYSQL_ARGS+=(--password="$DATABASE_PASSWORD"); fi
if [[ -n "${DATABASE_NAME:-}" ]]; then MYSQL_ARGS+=("$DATABASE_NAME"); fi
mysql_query() { mysql --batch --skip-column-names "${MYSQL_ARGS[@]}" -e "$1"; }

section "STEP 66 - Database Constraint & Transaction Rules"
run_required "Prisma schema validation" npm exec prisma validate
run_required "Prisma client generation" npm run prisma:generate

if [[ -n "${DATABASE_NAME:-}" && -n "${DATABASE_USER:-}" ]] && command_exists mysql; then
  constraint_sql="
SELECT CONCAT('PK|', TABLE_NAME, '|', GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION))
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME='PRIMARY'
GROUP BY TABLE_NAME
UNION ALL
SELECT CONCAT('UNIQUE|', TABLE_NAME, '|', CONSTRAINT_NAME, '|', GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION))
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME <> 'PRIMARY'
  AND CONSTRAINT_NAME IN (SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_TYPE='UNIQUE')
GROUP BY TABLE_NAME, CONSTRAINT_NAME
UNION ALL
SELECT CONCAT('FK|', TABLE_NAME, '|', CONSTRAINT_NAME, '|', COLUMN_NAME, '|', REFERENCED_TABLE_NAME, '|', REFERENCED_COLUMN_NAME)
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY 1;"
  if mysql_query "$constraint_sql"; then pass "Database primary/unique/FK constraint inventory"; else fail "Database primary/unique/FK constraint inventory"; fi
  fk_count="$(mysql_query "SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL;" 2>/dev/null || true)"
  if [[ "${fk_count:-0}" =~ ^[0-9]+$ ]] && (( fk_count > 0 )); then pass "Foreign-key constraints exist in actual database"; else fail "Foreign-key constraints exist in actual database"; fi
  show_fk_sql="SELECT CONCAT(k.TABLE_NAME, '|', k.COLUMN_NAME, '|', k.REFERENCED_TABLE_NAME, '|', rc.UPDATE_RULE, '|', rc.DELETE_RULE) FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME=k.CONSTRAINT_NAME WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY k.TABLE_NAME, k.COLUMN_NAME;"
  if mysql_query "$show_fk_sql"; then pass "Foreign-key ON UPDATE/ON DELETE behavior inventory"; else fail "Foreign-key ON UPDATE/ON DELETE behavior inventory"; fi
else
  fail "DATABASE_* settings and mysql client are available for live constraint validation"
fi

transaction_hits="$(grep -R '\$transaction' src prisma test 2>/dev/null | wc -l | tr -d ' ' || true)"
if [[ "${transaction_hits:-0}" =~ ^[0-9]+$ ]] && (( transaction_hits > 0 )); then pass "Transaction API usage is present"; else fail "No Prisma transaction API usage detected; multi-write/seed atomicity is not established"; fi

section "STEP 67 - Seed & Reference Data Strategy"
seed_files=(prisma/seeds/index.ts prisma/seeds/country.seed.ts prisma/seeds/region.seed.ts prisma/seeds/organization.seed.ts prisma/seeds/farmer.seed.ts prisma/seeds/farm.seed.ts prisma/seeds/processing-method.seed.ts prisma/seeds/coffee-grade.seed.ts prisma/seeds/harvest-season.seed.ts prisma/seeds/flavor-profile.seed.ts prisma/seeds/certification.seed.ts prisma/seeds/coffee-bean.seed.ts)
for seed_file in "${seed_files[@]}"; do
  if file_nonempty "$seed_file"; then pass "Seed file exists and is non-empty: $seed_file"; else fail "Seed file missing or empty: $seed_file"; fi
done
if [[ -f prisma.config.ts ]] && grep -Eq "seed:[[:space:]]*['\"]tsx prisma/seed\.ts['\"]" prisma.config.ts; then
  if [[ -f prisma/seed.ts ]]; then pass "Prisma seed entry point is configured and exists"; else fail "Prisma seed entry point is configured but prisma/seed.ts is missing"; fi
else
  fail "Prisma seed entry point is explicitly configured"
fi
if grep -R -Eq 'upsert\(|findUnique\(|findFirst\(' prisma/seeds 2>/dev/null; then pass "Seed idempotency strategy is detectable"; else fail "No deterministic idempotency strategy detected in seed implementation"; fi
if grep -R -Eq 'Math\.random|randomUUID\(|Date\.now\(' prisma/seeds prisma/seed.ts 2>/dev/null; then fail "Non-deterministic seed generation detected"; else pass "No obvious random/time-based seed generation detected"; fi
if grep -R -Eq '\$transaction' prisma/seeds prisma/seed.ts 2>/dev/null; then pass "Seed transaction usage detected"; else fail "Seed transaction/atomicity strategy not detected"; fi

section "STEP 68 - Seed Data Integrity Testing"
integrity_test_hits="$(find test src -type f \( -name '*.spec.ts' -o -name '*.test.ts' \) -print 2>/dev/null | wc -l | tr -d ' ' || true)"
if [[ "${integrity_test_hits:-0}" =~ ^[0-9]+$ ]] && (( integrity_test_hits > 0 )); then pass "Test suite contains executable test files"; else fail "No test files found for seed/integrity validation"; fi
relationship_terms=(country region organization farmer farm species variety coffeeBean processingMethod coffeeGrade harvestSeason flavorProfile sensoryProfile sensoryProfileFlavor)
for term in "${relationship_terms[@]}"; do
  if grep -Riq "$term" test src prisma/seeds 2>/dev/null; then pass "Integrity coverage contains: $term"; else fail "Integrity coverage missing: $term"; fi
done
if [[ -n "${DATABASE_NAME:-}" && -n "${DATABASE_USER:-}" ]] && command_exists mysql; then
  orphan_checks=("regions.countryId:countries.id" "organizations.regionId:regions.id" "farmers.regionId:regions.id" "farmers.organizationId:organizations.id" "farms.farmerId:farmers.id" "varieties.speciesId:species.id" "coffee_beans.regionId:regions.id" "coffee_beans.farmerId:farmers.id" "coffee_beans.farmId:farms.id" "coffee_beans.speciesId:species.id" "coffee_beans.varietyId:varieties.id" "coffee_beans.processingMethodId:processing_methods.id" "coffee_beans.gradeId:coffee_grades.id" "coffee_beans.harvestSeasonId:harvest_seasons.id" "sensory_profiles.coffeeBeanId:coffee_beans.id" "sensory_profile_flavors.sensoryProfileId:sensory_profiles.id" "sensory_profile_flavors.flavorProfileId:flavor_profiles.id")
  for relation in "${orphan_checks[@]}"; do
    child="${relation%%:*}"; parent="${relation##*:}"; child_table="${child%%.*}"; child_col="${child##*.}"; parent_table="${parent%%.*}"; parent_col="${parent##*.}"
    q="SELECT COUNT(*) FROM ${child_table} c LEFT JOIN ${parent_table} p ON p.${parent_col}=c.${child_col} WHERE c.${child_col} IS NOT NULL AND p.${parent_col} IS NULL;"
    orphan_count="$(mysql_query "$q" 2>/dev/null || true)"
    if [[ "$orphan_count" == "0" ]]; then pass "No orphan references: $child"; else fail "Orphan references detected: $child -> $parent (count=${orphan_count:-unknown})"; fi
  done
else
  fail "Live database is available for seed relationship/orphan validation"
fi
if [[ "${VERIFY_ALLOW_SEED_MUTATION:-false}" == "true" ]]; then
  if [[ "${NODE_ENV:-}" == "test" && "${DATABASE_NAME:-}" == *_test ]]; then
    printf '  [RUN ] Seed repeatability (two executions on test DB)\n'
    if npm run prisma:seed && npm run prisma:seed; then pass "Seed repeatability/idempotency"; else fail "Seed repeatability/idempotency"; fi
  else
    fail "Seed mutation requested but NODE_ENV=test and DATABASE_NAME=*_test are not both satisfied"
  fi
else
  skip "Seed repeatability mutation test disabled; rerun with VERIFY_ALLOW_SEED_MUTATION=true on a *_test database"
fi

section "STEP 69 - Database Query & Index Performance"
if [[ -n "${DATABASE_NAME:-}" && -n "${DATABASE_USER:-}" ]] && command_exists mysql; then
  index_sql="SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;"
  if mysql_query "$index_sql"; then pass "Existing PK/unique/FK/index inventory"; else fail "Existing PK/unique/FK/index inventory"; fi
  critical_queries=("countries|SELECT id FROM countries WHERE uuid='__verify_missing__' LIMIT 1" "countries-code|SELECT id FROM countries WHERE code='__verify_missing__' LIMIT 1" "regions-country|SELECT id FROM regions WHERE countryId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20" "farmers-region|SELECT id FROM farmers WHERE regionId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20" "farms-farmer|SELECT id FROM farms WHERE farmerId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20" "coffee-beans-region|SELECT id FROM coffee_beans WHERE regionId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20" "coffee-beans-farmer|SELECT id FROM coffee_beans WHERE farmerId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20" "coffee-beans-species|SELECT id FROM coffee_beans WHERE speciesId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20" "coffee-beans-variety|SELECT id FROM coffee_beans WHERE varietyId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20" "coffee-beans-processing|SELECT id FROM coffee_beans WHERE processingMethodId='__verify_missing__' AND isActive=1 ORDER BY sortOrder LIMIT 20")
  for item in "${critical_queries[@]}"; do
    label="${item%%|*}"; query="${item#*|}"
    if plan="$(mysql_query "EXPLAIN ${query}" 2>/dev/null)"; then
      printf '  [INFO] Query plan: %s\n%s\n' "$label" "$plan"
      if grep -Eq $'\tALL\t' <<< "$plan"; then fail "Critical query has an ALL/full-scan access path: $label"; else pass "Critical query has no obvious ALL/full-scan access path: $label"; fi
    else
      fail "EXPLAIN failed: $label"
    fi
  done
  duplicate_index_sql="SELECT TABLE_NAME, COLUMN_NAME, COUNT(DISTINCT INDEX_NAME) AS index_count FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() GROUP BY TABLE_NAME, COLUMN_NAME HAVING COUNT(DISTINCT INDEX_NAME) > 1 ORDER BY TABLE_NAME, COLUMN_NAME;"
  duplicate_indexes="$(mysql_query "$duplicate_index_sql" 2>/dev/null || true)"
  if [[ -z "$duplicate_indexes" ]]; then pass "No obvious duplicate single-column indexes"; else printf '%s\n' "$duplicate_indexes"; fail "Potential duplicate/redundant single-column indexes require review"; fi
else
  fail "Live database and mysql client are available for query/index validation"
fi
if grep -RiqE '\.findMany\([^)]*include:|\.findMany\([^)]*select:|Promise\.all\(' src 2>/dev/null; then pass "Repository query code has explicit relation/select handling patterns"; else skip "Static N+1 heuristic found no explicit relation/select pattern; inspect critical repository flows manually"; fi

section "STEP 70 - gRPC Contract Architecture"
PROTO="proto/master-data/v1/master-data.proto"
if [[ -s "$PROTO" ]]; then pass "Versioned master-data.proto exists and is non-empty"; else fail "Versioned master-data.proto is missing or empty"; fi
if [[ -f "$PROTO" ]] && grep -q '^syntax = "proto3";' "$PROTO"; then pass "Proto3 syntax"; else fail "Proto3 syntax"; fi
if [[ -f "$PROTO" ]] && grep -q '^package arunika\.coffee\.master_data\.v1;' "$PROTO"; then pass "Package/version naming"; else fail "Package/version naming"; fi
if [[ -f "$PROTO" ]] && grep -q '^service MasterDataService' "$PROTO"; then pass "MasterDataService naming"; else fail "MasterDataService naming"; fi
if [[ -f "$PROTO" ]] && grep -q 'rpc GetHealth(GetHealthRequest) returns (GetHealthResponse);' "$PROTO"; then pass "RPC request/response convention"; else fail "RPC request/response convention"; fi
if [[ -f "$PROTO" ]] && grep -Eq '^[[:space:]]*(optional|repeated)[[:space:]]' "$PROTO"; then pass "Proto optional/repeated semantics are explicit where used"; else skip "No optional/repeated fields are currently required by the health-only contract"; fi
rpc_count="$(grep -Ec '^[[:space:]]*rpc[[:space:]]' "$PROTO" 2>/dev/null || true)"
if [[ "${rpc_count:-0}" =~ ^[0-9]+$ ]] && (( rpc_count > 0 )); then printf '  [INFO] RPC count: %s\n' "$rpc_count"; pass "RPC definitions are present"; else fail "No RPC definition found"; fi
if [[ -f proto/master-data/master-data.proto && ! -s proto/master-data/master-data.proto ]]; then skip "Legacy proto/master-data/master-data.proto is empty; v1 contract is authoritative"; fi
if grep -Riq 'master-data/v1/master-data.proto\|master-data.proto' src test 2>/dev/null; then pass "Master-data proto is referenced by application/test configuration"; else fail "No application/test reference to master-data proto detected"; fi

section "Cross-step Quality Gate"
run_required "TypeScript typecheck" npm run typecheck
run_required "ESLint" npm run lint
run_required "Prettier check" npm run format:check
run_required "Build" npm run build
run_required "Full test suite" npm test

printf '\n============================================================\n'
printf 'STEPS 66-70 VERIFICATION SUMMARY\n'
printf 'PASS: %d | FAIL: %d | SKIP: %d\n' "$PASS_COUNT" "$FAIL_COUNT" "$SKIP_COUNT"
printf '============================================================\n'
if (( FAIL_COUNT > 0 )); then printf 'OVERALL: NOT PASS\n'; exit 1; fi
printf 'OVERALL: PASS\n'
exit 0
