#!/usr/bin/env bash
# Source-only backup of the KTU Notes project.
# Usage: scripts/backup.sh [output.zip]
set -euo pipefail
cd "$(dirname "$0")/.."
out="${1:-ktu-notes-backup.zip}"
rm -f "$out"
zip -r "$out" . \
  -x "node_modules/*" ".next/*" ".screens/*" "*.zip" ".git/*" \
  -x ".env.local" ".env.*.local" ".env" "npm-debug.log*" "*.log"
echo "Created $(pwd)/$out"
unzip -l "$out" | tail -n 3
