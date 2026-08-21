#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_DIR="$SCRIPT_DIR/verify"

if [[ ! -d "$VERIFY_DIR" ]]; then
  echo "ERROR: Verification directory not found: $VERIFY_DIR"
  exit 1
fi

shopt -s nullglob
scripts=("$VERIFY_DIR"/steps-*.sh)

if [[ ${#scripts[@]} -eq 0 ]]; then
  echo "ERROR: No verification scripts found in: $VERIFY_DIR"
  exit 1
fi

echo
echo "============================================================"
echo " MASTER DATA SERVICE VERIFICATION"
echo " Steps 26-70"
echo "============================================================"

for script in "${scripts[@]}"; do
  echo
  echo "============================================================"
  echo " VERIFYING: ${script#$SCRIPT_DIR/}"
  echo "============================================================"

  bash "$script"

  echo "------------------------------------------------------------"
  echo " PASS: ${script#$SCRIPT_DIR/}"
  echo "------------------------------------------------------------"
done

echo
echo "============================================================"
echo " ALL VERIFICATION STEPS PASSED"
echo " Steps 26-70"
echo "============================================================"