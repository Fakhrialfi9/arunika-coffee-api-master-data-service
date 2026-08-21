#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"; cd "$ROOT"
R="${REPORT_FILE:-tmp/steps-31-35-report.txt}"; mkdir -p "$(dirname "$R")"; : >"$R"; T=0;P=0;F=0
pass() { T=$((T+1)); P=$((P+1)); printf 'PASS %s\n' "$*"|tee -a "$R"; }
fail() { T=$((T+1)); F=$((F+1)); printf 'FAIL %s\n' "$*"|tee -a "$R"; }
S() { mysql --protocol=tcp --batch --skip-column-names -h "${DATABASE_HOST:-127.0.0.1}" -P "${DATABASE_PORT:-3306}" -u "${DATABASE_USER:-dev}" -p"${DATABASE_PASSWORD:-dev123}" -e "$1" 2>/dev/null|tail -n1|tr -d '\r'; }
DB="${DATABASE_NAME:-arunika_coffee_master_data}"
for x in countries regions organizations farmers farms; do [[ "$(S "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$x'")" == 1 ]]&&pass "Steps 31-35: table $x"||fail "Steps 31-35: table $x"; done
for x in 'regions|countryId|countries' 'organizations|regionId|regions' 'farmers|regionId|regions' 'farmers|organizationId|organizations' 'farms|farmerId|farmers'; do IFS='|' read -r t c r<<<"$x"; [[ "$(S "SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA='$DB' AND TABLE_NAME='$t' AND COLUMN_NAME='$c' AND REFERENCED_TABLE_NAME='$r'")" == 1 ]]&&pass "Steps 31-35: $t.$c -> $r"||fail "Steps 31-35: $t.$c -> $r"; done
for x in 'countries|uuid' 'countries|code' 'regions|uuid' 'regions|code' 'organizations|code' 'farmers|code' 'farms|uuid'; do IFS='|' read -r t c<<<"$x"; [[ "$(S "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$t' AND COLUMN_NAME='$c' AND NON_UNIQUE=0")" -ge 1 ]]&&pass "Steps 31-35: unique $t.$c"||fail "Steps 31-35: unique $t.$c"; done
printf '\nRESULT Steps 31-35: %s PASS / %s FAIL\n' "$P" "$F"|tee -a "$R"; [[ $F -eq 0 ]]