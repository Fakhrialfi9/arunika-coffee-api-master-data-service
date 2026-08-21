#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

REPORT="${REPORT_FILE:-tmp/steps-26-30-report.txt}"
mkdir -p "$(dirname "$REPORT")"
: > "$REPORT"

P=0
F=0

pass() {
  P=$((P + 1))
  printf 'PASS %s\n' "$*" | tee -a "$REPORT"
}

fail() {
  F=$((F + 1))
  printf 'FAIL %s\n' "$*" | tee -a "$REPORT"
}

run_check() {
  local label="$1"
  shift

  if "$@" >>"$REPORT" 2>&1; then
    pass "$label"
  else
    fail "$label"
  fi
}

mysql_scalar() {
  mysql \
    --protocol=tcp \
    --batch \
    --skip-column-names \
    -h "${DATABASE_HOST:-127.0.0.1}" \
    -P "${DATABASE_PORT:-3306}" \
    -u "${DATABASE_USER:-dev}" \
    -p"${DATABASE_PASSWORD:-dev123}" \
    -e "$1" 2>/dev/null | tail -n1 | tr -d '\r'
}

DB="${DATABASE_NAME:-arunika_coffee_master_data}"

[[ "$(git branch --show-current)" == "main" ]] \
  && pass 'Step 26: branch is main' \
  || fail 'Step 26: branch must be main'

[[ -f package.json && -f package-lock.json && -f prisma.config.ts ]] \
  && pass 'Step 26: foundation manifests/config exist' \
  || fail 'Step 26: foundation manifests/config missing'

node -e '
const p = require("./package.json");
const ok =
  p.engines?.node === "22.x" &&
  p.devDependencies?.prisma === "7.9.1" &&
  p.dependencies?.["@prisma/client"] === "7.9.1";
process.exit(ok ? 0 : 1);
' \
  && pass 'Step 26: Node 22 + Prisma 7.9.1 contract' \
  || fail 'Step 26: Node/Prisma contract mismatch'

[[ -d src/domain || -d src/application ]] \
  && pass 'Step 27: layered source structure exists' \
  || fail 'Step 27: layered source structure missing'

[[ -d src/infrastructure && -d src/presentation ]] \
  && pass 'Step 27: infrastructure/presentation boundaries exist' \
  || fail 'Step 27: infrastructure/presentation boundaries missing'

if ! grep -R --include='*.ts' -E 'new PrismaClient|DATABASE_URL' \
  src/presentation src/*/presentation 2>/dev/null | grep -q .; then
  pass 'Step 27: presentation has no direct DB access'
else
  fail 'Step 27: presentation directly accesses DB'
fi

run_check 'Step 28: prisma validate' node_modules/.bin/prisma validate
run_check 'Step 28: prisma generate' node_modules/.bin/prisma generate
run_check 'Step 28: prisma migration status' node_modules/.bin/prisma migrate status

if mysql \
  --protocol=tcp \
  --batch \
  --skip-column-names \
  -h "${DATABASE_HOST:-127.0.0.1}" \
  -P "${DATABASE_PORT:-3306}" \
  -u "${DATABASE_USER:-dev}" \
  -p"${DATABASE_PASSWORD:-dev123}" \
  -e 'SELECT 1' >/dev/null 2>&1; then
  pass 'Step 28: MySQL connection'
else
  fail 'Step 28: MySQL connection'
fi

[[ "$(mysql_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='$DB'")" == 1 ]] \
  && pass "Step 28: database $DB exists" \
  || fail "Step 28: database $DB missing"

EXPECTED='_prisma_migrations certifications coffee_beans coffee_grades countries farmers farms flavor_profiles harvest_seasons organizations processing_methods regions sensory_profile_flavors sensory_profiles species varieties'

for table in $EXPECTED; do
  if [[ "$(mysql_scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$table'")" == 1 ]]; then
    pass "Step 29: table $table"
  else
    fail "Step 29: missing table $table"
  fi
done

# INFORMATION_SCHEMA.STATISTICS.INDEX_NAME contains the physical index name
# (for example PRIMARY), not SHOW COLUMNS' Key values (PRI/UNI/MUL).
# Therefore index validation must check the actual indexed column and its
# uniqueness semantics instead of comparing INDEX_NAME to PRI/UNI/MUL.
for x in \
  'countries|id|any' \
  'countries|uuid|unique' \
  'countries|code|unique' \
  'countries|iso2|unique' \
  'countries|iso3|unique' \
  'regions|countryId|any' \
  'coffee_beans|regionId|any' \
  'coffee_beans|speciesId|any' \
  'sensory_profiles|coffeeBeanId|unique'; do
  IFS='|' read -r table column requirement <<<"$x"

  if [[ "$requirement" == "unique" ]]; then
    query="SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$table' AND COLUMN_NAME='$column' AND NON_UNIQUE=0"
  else
    query="SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$table' AND COLUMN_NAME='$column'"
  fi

  if [[ "$(mysql_scalar "$query")" -ge 1 ]]; then
    pass "Step 29: key/index $table.$column"
  else
    fail "Step 29: key/index $table.$column"
  fi
done

for x in \
  'regions|countryId|countries|id' \
  'organizations|regionId|regions|id' \
  'farmers|regionId|regions|id' \
  'farmers|organizationId|organizations|id' \
  'farms|farmerId|farmers|id' \
  'varieties|speciesId|species|id' \
  'coffee_beans|regionId|regions|id' \
  'coffee_beans|farmerId|farmers|id' \
  'coffee_beans|farmId|farms|id' \
  'coffee_beans|speciesId|species|id' \
  'coffee_beans|varietyId|varieties|id' \
  'coffee_beans|processingMethodId|processing_methods|id' \
  'coffee_beans|gradeId|coffee_grades|id' \
  'coffee_beans|harvestSeasonId|harvest_seasons|id' \
  'sensory_profiles|coffeeBeanId|coffee_beans|id' \
  'sensory_profile_flavors|sensoryProfileId|sensory_profiles|id' \
  'sensory_profile_flavors|flavorProfileId|flavor_profiles|id'; do
  IFS='|' read -r table column referenced_table referenced_column <<<"$x"

  query="SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='$DB' AND TABLE_NAME='$table' AND COLUMN_NAME='$column' AND REFERENCED_TABLE_NAME='$referenced_table' AND REFERENCED_COLUMN_NAME='$referenced_column'"

  if [[ "$(mysql_scalar "$query")" == 1 ]]; then
    pass "Step 30: FK $table.$column -> $referenced_table.$referenced_column"
  else
    fail "Step 30: FK $table.$column -> $referenced_table.$referenced_column"
  fi
done

echo | tee -a "$REPORT"
printf 'RESULT Steps 26-30: %s PASS / %s FAIL\n' "$P" "$F" | tee -a "$REPORT"

[[ "$F" -eq 0 ]]