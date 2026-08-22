#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

run() {
  printf '\n==> %s\n' "$*"
  "$@"
}

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "BLOCKER: required file not found: $1" >&2
    exit 1
  fi
}

PROTO_FILES=()
while IFS= read -r file; do
  PROTO_FILES+=("$file")
done < <(find proto -type f -name '*.proto' 2>/dev/null | sort)

if [[ ${#PROTO_FILES[@]} -eq 0 ]]; then
  echo 'BLOCKER: no .proto contract found under proto/' >&2
  exit 1
fi

for proto in "${PROTO_FILES[@]}"; do
  require_file "$proto"
  grep -Eq '^syntax = "proto3";' "$proto" || {
    echo "BLOCKER: proto3 syntax missing in $proto" >&2
    exit 1
  }
  grep -Eq '^package [A-Za-z0-9_.]+;' "$proto" || {
    echo "BLOCKER: package declaration missing in $proto" >&2
    exit 1
  }
done

run npx prisma validate
run npx prisma generate
run npm run typecheck
run npm run lint
run npm run format:check
run npm run test:unit
run npm run test:grpc
run npm run test:e2e
run npm run build

printf '\nPASS: Steps 71-75 verification command suite completed successfully.\n'
