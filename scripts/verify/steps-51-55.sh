#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; cd "$ROOT"; R="${REPORT_FILE:-tmp/steps-51-55-report.txt}"; mkdir -p "$(dirname "$R")"; : >"$R"; T=0;P=0;F=0
pass() { T=$((T+1));P=$((P+1));printf 'PASS %s\n' "$*"|tee -a "$R"; }; fail() { T=$((T+1));F=$((F+1));printf 'FAIL %s\n' "$*"|tee -a "$R"; }
grep -R -q '@relation' prisma/schema 2>/dev/null&&pass 'Step 54: Prisma relations present'||fail 'Step 54: Prisma relations missing'
[[ -f prisma.config.ts && -d prisma/schema ]]&&pass 'Step 54: Prisma schema composition present'||fail 'Step 54: Prisma schema composition missing'
grep -R -q 'PrismaClient' src 2>/dev/null&&pass 'Step 55: Prisma Client wired'||fail 'Step 55: Prisma Client missing'
grep -R -qiE 'repository|repositoryinterface' src/domain src/infrastructure src/application 2>/dev/null&&pass 'Step 55: repository layer present'||fail 'Step 55: repository layer missing'
grep -R -qE 'regionId|farmerId|farmId|speciesId|varietyId|processingMethodId|gradeId|harvestSeasonId' prisma/schema/coffee-bean.prisma&&pass 'Step 51: CoffeeBean dependency fields present'||fail 'Step 51: CoffeeBean dependency fields missing'
grep -R -qE 'cuppingScore|moisture|density|availableWeight|reservedWeight|weightUnit' prisma/schema/coffee-bean.prisma&&pass 'Step 52: CoffeeBean quality/inventory fields'||fail 'Step 52: CoffeeBean quality/inventory fields missing'
for t in countries regions organizations farmers farms species varieties processing_methods coffee_grades harvest_seasons certifications flavor_profiles sensory_profiles coffee_beans; do grep -R -q "$t" prisma/schema 2>/dev/null&&pass "Step 53: schema coverage $t"||fail "Step 53: schema coverage $t"; done
printf '\nRESULT Steps 51-55: %s PASS / %s FAIL\n' "$P" "$F"|tee -a "$R"; [[ $F -eq 0 ]]