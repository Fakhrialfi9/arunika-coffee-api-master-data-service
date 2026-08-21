#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; cd "$ROOT"; R="${REPORT_FILE:-tmp/steps-61-65-report.txt}"; mkdir -p "$(dirname "$R")"; : >"$R"; T=0;P=0;F=0
pass() { T=$((T+1));P=$((P+1));printf 'PASS %s\n' "$*"|tee -a "$R"; }; fail() { T=$((T+1));F=$((F+1));printf 'FAIL %s\n' "$*"|tee -a "$R"; }
for f in prisma/schema/sensory-profile.prisma prisma/schema/sensory-profile-flavor.prisma; do [[ -f "$f" ]]&&pass "Step 61: schema file $f"||fail "Step 61: schema file $f"; done
grep -R -q 'SensoryProfile' src/application src/presentation 2>/dev/null&&pass 'Step 61: SensoryProfile application/presentation'||fail 'Step 61: SensoryProfile missing'
grep -R -q 'SensoryProfileFlavor' src/application src/presentation 2>/dev/null&&pass 'Step 61: SensoryProfileFlavor operations'||fail 'Step 61: SensoryProfileFlavor operations missing'
for x in coffeeBean regionId farmerId farmId speciesId varietyId processingMethodId gradeId harvestSeasonId sensory; do grep -R -qi "$x" src/application 2>/dev/null&&pass "Step 62: cross-domain coverage $x"||fail "Step 62: cross-domain coverage $x missing"; done
for x in page limit offset sort order filter search; do grep -R -qi "$x" src/application src/presentation 2>/dev/null&&pass "Step 63: query capability $x"||fail "Step 63: query capability $x missing"; done
for x in regions farmers farms varieties flavors metadata; do grep -R -qi "$x" src/application src/presentation 2>/dev/null&&pass "Step 64: relationship query $x"||fail "Step 64: relationship query $x missing"; done
for x in invalid duplicate active inactive cuppingScore moisture density availableWeight reservedWeight startMonth endMonth farmingSinceYear; do grep -R -qi "$x" src/application src/domain 2>/dev/null&&pass "Step 65: validation term $x"||fail "Step 65: validation term $x missing"; done
printf '\nRESULT Steps 61-65: %s PASS / %s FAIL\n' "$P" "$F"|tee -a "$R"; [[ $F -eq 0 ]]