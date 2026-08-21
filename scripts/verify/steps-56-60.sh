#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; cd "$ROOT"; R="${REPORT_FILE:-tmp/steps-56-60-report.txt}"; mkdir -p "$(dirname "$R")"; : >"$R"; T=0;P=0;F=0
pass() { T=$((T+1));P=$((P+1));printf 'PASS %s\n' "$*"|tee -a "$R"; }; fail() { T=$((T+1));F=$((F+1));printf 'FAIL %s\n' "$*"|tee -a "$R"; }
for d in src/domain src/application src/infrastructure src/presentation; do [[ -d "$d" ]]&&pass "Steps 56-57: $d exists"||fail "Steps 56-57: $d missing"; done
! grep -R -qE '(@prisma/client|new PrismaClient)' src/domain 2>/dev/null&&pass 'Step 56: domain independent from Prisma'||fail 'Step 56: domain imports Prisma'
grep -R -qiE 'interface .*Repository|Repository' src/domain src/infrastructure 2>/dev/null&&pass 'Step 56: repository contracts/implementations'||fail 'Step 56: repository layer missing'
grep -R -qE '@Injectable|UseCase|use-case|execute\(' src/application 2>/dev/null&&pass 'Step 57: application orchestration present'||fail 'Step 57: application orchestration missing'
for x in create get list update delete; do grep -R -qi "$x" src/application src/presentation 2>/dev/null&&pass "Steps 58-60: $x operation represented"||fail "Steps 58-60: $x operation missing"; done
for x in country region organization farmer farm species variety processing coffee-grade harvest certification flavor coffee-bean; do grep -R -qi "$x" src/application src/presentation 2>/dev/null&&pass "Steps 58-60: coverage $x"||fail "Steps 58-60: coverage $x missing"; done
grep -R -q 'varietyId must belong to the selected speciesId' src/application 2>/dev/null&&pass 'Step 60: Species/Variety invariant'||fail 'Step 60: Species/Variety invariant missing'
grep -R -q 'farmId must belong to farmerId' src/application 2>/dev/null&&pass 'Step 60: Farmer/Farm invariant'||fail 'Step 60: Farmer/Farm invariant missing'
printf '\nRESULT Steps 56-60: %s PASS / %s FAIL\n' "$P" "$F"|tee -a "$R"; [[ $F -eq 0 ]]