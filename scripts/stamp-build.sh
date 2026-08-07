#!/usr/bin/env bash
# Stamp footer build identity into HTML files before deploy.
# Format: rev <7-char-sha> · built <YYYY-MM-DDTHH:MM:SSZ>
# Markers: <!--BUILD_ID-->…<!--/BUILD_ID-->
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "stamp-build: not a git repository" >&2
  exit 1
fi

REV="$(git -C "$ROOT" rev-parse --short=7 HEAD)"
BUILT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
META="rev ${REV} · built ${BUILT}"

if [[ $# -gt 0 ]]; then
  TARGETS=("$@")
else
  TARGETS=("$ROOT/index.html" "$ROOT/404.html")
fi

for TARGET in "${TARGETS[@]}"; do
  if [[ ! -f "$TARGET" ]]; then
    echo "stamp-build: skip missing $TARGET" >&2
    continue
  fi
  python3 - "$TARGET" "$META" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
meta = sys.argv[2]
text = path.read_text(encoding="utf-8")
pattern = re.compile(r"(<!--BUILD_ID-->)(.*?)(<!--/BUILD_ID-->)", re.DOTALL)
if not pattern.search(text):
    sys.stderr.write(f"stamp-build: BUILD_ID markers not found in {path}\n")
    sys.exit(1)
new_text, n = pattern.subn(rf"\1{meta}\3", text, count=1)
if n != 1:
    sys.stderr.write(f"stamp-build: expected 1 replacement in {path}, got {n}\n")
    sys.exit(1)
path.write_text(new_text, encoding="utf-8")
print(f"stamped {path}: {meta}")
PY
done
