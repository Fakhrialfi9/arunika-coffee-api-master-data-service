#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; cd "$ROOT"
REPORT="${REPORT_FILE:-tmp/steps-26-30-report.txt}"; mkdir -p "$(dirname "$REPORT")"; : > "$REPORT"
T=0; P=0; F=0
pass(){ T=$((T+1)); P=$((P+1)); printf 'PASS %s\n' "$*" | tee -a "$REPORT"; }
fail(){ T=$((T+1)); F=$((F+1)); printf 'FAIL %s\n' "$*" | tee -a "$REPORT"; }
check(){ if "$@" >>"$REPORT" 2>&1; then pass "$1"; else fail "$1"; fi; }
scalar(){ mysql --protocol=tcp --batch --skip-column-names -h "${DATABASE_HOST:-127.0.0.1}" -P "${DATABASE_PORT:-3306}" -u "${DATABASE_USER:-dev}" -p"${DATABASE_PASSWORD:-dev123}" -e "$1" 2>/dev/null | tail -n1 | tr -d '\r'; }
DB="${DATABASE_NAME:-arunika_coffee_master_data}"
[[ "$(git branch --show-current)" == main ]] && pass 'Step 26: branch is main' || fail 'Step 26: branch must be main'
[[ -f package.json && -f package-lock.json && -f prisma.config.ts ]] && pass 'Step 26: foundation manifests/config exist' || fail 'Step 26: foundation manifests/config missing'
node -e 'const p=require("./package.json");process.exit(p.engines?.node==="22.x"&&p.devDependencies?.prisma==="7.9.1"&&p.dependencies?.["@prisma/client"]==="7.9.1"?0:1)' && pass 'Step 26: Node 22 + Prisma 7.9.1 contract' || fail 'Step 26: Node/Prisma contract mismatch'
[[ -d src/domain || -d src/application ]] && pass 'Step 27: layered source structure exists' || fail 'Step 27: layered source structure missing'
[[ -d src/infrastructure && -d src/presentation ]] && pass 'Step 27: infrastructure/presentation boundaries exist' || fail 'Step 27: infrastructure/presentation boundaries missing'
! grep -R --include='*.ts' -E 'new PrismaClient|DATABASE_URL' src/presentation src/*/presentation 2>/dev/null | grep -q . && pass 'Step 27: presentation has no direct DB access' || fail 'Step 27: presentation directly accesses DB'
check node_modules/.bin/prisma validate
check node_modules/.bin/prisma generate
check node_modules/.bin/prisma migrate status
mysql --protocol=tcp --batch --skip-column-names -h "${DATABASE_HOST:-127.0.0.1}" -P "${DATABASE_PORT:-3306}" -u "${DATABASE_USER:-dev}" -p"${DATABASE_PASSWORD:-dev123}" -e 'SELECT 1' >/dev/null 2>&1 && pass "Step 28: MySQL connection" || fail 'Step 28: MySQL connection'
[[ "$(scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='$DB'")" == 1 ]] && pass "Step 28: database $DB exists" || fail "Step 28: database $DB missing"
EXPECTED='_prisma_migrations certifications coffee_beans coffee_grades countries farmers farms flavor_profiles harvest_seasons organizations processing_methods regions sensory_profile_flavors sensory_profiles species varieties'
for table in $EXPECTED; do [[ "$(scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$table'")" == 1 ]] && pass "Step 29: table $table" || fail "Step 29: missing table $table"; done
for x in 'countries|id|PRI' 'countries|uuid|UNI' 'countries|code|UNI' 'countries|iso2|UNI' 'countries|iso3|UNI' 'regions|countryId|MUL' 'coffee_beans|regionId|MUL' 'coffee_beans|speciesId|MUL' 'sensory_profiles|coffeeBeanId|UNI'; do IFS='|' read -r t c k <<<"$x"; [[ "$(scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$t' AND COLUMN_NAME='$c' AND INDEX_NAME='$k'")" -ge 1 ]] && pass "Step 29: key/index $t.$c" || fail "Step 29: key/index $t.$c"; done
for x in 'regions|countryId|countries|id' 'organizations|regionId|regions|id' 'farmers|regionId|regions|id' 'farmers|organizationId|organizations|id' 'farms|farmerId|farmers|id' 'varieties|speciesId|species|id' 'coffee_beans|regionId|regions|id' 'coffee_beans|farmerId|farmers|id' 'coffee_beans|farmId|farms|id' 'coffee_beans|speciesId|species|id' 'coffee_beans|varietyId|varieties|id' 'coffee_beans|processingMethodId|processing_methods|id' 'coffee_beans|gradeId|coffee_grades|id' 'coffee_beans|harvestSeasonId|harvest_seasons|id' 'sensory_profiles|coffeeBeanId|coffee_beans|id' 'sensory_profile_flavors|sensoryProfileId|sensory_profiles|id' 'sensory_profile_flavors|flavorProfileId|flavor_profiles|id'; do IFS='|' read -r t c r rc <<<"$x"; [[ "$(scalar "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='$DB' AND TABLE_NAME='$t' AND COLUMN_NAME='$c' AND REFERENCED_TABLE_NAME='$r' AND REFERENCED_COLUMN_NAME='$rc'")" == 1 ]] && pass "Step 30: FK $t.$c -> $r.$rc" || fail "Step 30: FK $t.$c -> $r.$rc"; done
printf '\nRESULT Steps 26-30: %s PASS / %s FAIL\n' "$P" "$F" | tee -a "$REPORT"; [[ $F -eq 0 ]]