#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)";cd "$ROOT";R="${REPORT_FILE:-tmp/steps-56-60-report.txt}";mkdir -p "$(dirname "$R")";:>"$R";T=0;P=0;F=0
pass(){T=$((T+1));P=$((P+1));printf 'PASS %s\n' "$*"|tee -a "$R";};fail(){T=$((T+1));F=$((F+1));printf 'FAIL %s\n' "$*"|tee -a "$R";};has(){ grep -R -qE "$1" "$2" 2>/dev/null; }
for d in src/domain src/application src/infrastructure src/presentation;do [[ -d "$d" ]]&&pass "Step 56-57: directory $d"||fail "Step 56-57: missing directory $d";done
has 'interface .*Repository|abstract class .*Repository|Repository' src/domain && pass 'Step 56: domain repository contracts present'||fail 'Step 56: domain repository contracts missing'
! grep -R -qE 'from[[:space:]]+["'"'](@prisma/client|.*prisma)' src/domain 2>/dev/null&&pass 'Step 56: domain independent from Prisma'||fail 'Step 56: domain imports Prisma'
has 'class .*Service|@Injectable|execute\(' src/application && pass 'Step 57: application use-case/service layer present'||fail 'Step 57: application layer missing'
has '@Injectable|use-case|UseCase|Command|Query' src/application && pass 'Step 57: application orchestration patterns present'||fail 'Step 57: application orchestration missing'
for entity in country region organization farmer farm species variety processing-method coffee-grade harvest-season certification flavor-profile coffee-bean sensory-profile;do grep -R -qi "$entity" src/domain src/application 2>/dev/null&&pass "Step 58-60: domain/application contains $entity"||fail "Step 58-60: missing domain/application coverage $entity";done
for op in create get list update delete;do grep -R -qiE "$op" src/application src/presentation 2>/dev/null&&pass "Step 58-60: operation $op represented"||fail "Step 58-60: operation $op missing";done
# Protect the two cross-entity invariants already established by the implementation.
grep -R -q 'varietyId must belong to the selected speciesId' src/application 2>/dev/null&&pass 'Step 60: Species -> Variety consistency'||fail 'Step 60: Species -> Variety consistency missing'
grep -R -q 'farmId must belong to farmerId' src/application 2>/dev/null&&pass 'Step 60: Farmer -> Farm consistency'||fail 'Step 60: Farmer -> Farm consistency missing'
grep -R -q 'flavorProfiles\|aromaNotes' prisma/schema 2>/dev/null&&pass 'Step 60: CoffeeBean JSON fields preserved'||fail 'Step 60: CoffeeBean JSON fields missing'
printf '\nRESULT Steps 56-60: %s PASS / %s FAIL\n' "$P" "$F"|tee -a "$R";[[ $F -eq 0 ]]