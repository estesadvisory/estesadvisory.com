#!/usr/bin/env bash
# Stamp footer build identity into HTML before deploy.
# Spec: portfolio-ops docs/BUILD_IDENTITY.md
# Markers:
#   <!--BUILD_ID-->…<!--/BUILD_ID-->  (legacy visible line)
#   and/or data-rev / data-built-utc / data-version on .ea-build-id
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "stamp-build: not a git repository" >&2
  exit 1
fi

REV="$(git -C "$ROOT" rev-parse --short=7 HEAD)"
BUILT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
# CalVer + HHMM UTC (no manual bump)
VERSION="$(date -u +"%Y.%-m.%-d.%H%M" 2>/dev/null || date -u +"%Y.%m.%d.%H%M" | sed 's/\.0/\./g')"
# macOS date doesn't support %-m; use python for portable CalVer
VERSION="$(python3 - <<PY
from datetime import datetime, timezone
d = datetime.now(timezone.utc)
print(f"{d.year}.{d.month}.{d.day}.{d.hour:02d}{d.minute:02d}")
PY
)"
META="rev ${REV} · v${VERSION} · ${BUILT}"

if [[ $# -gt 0 ]]; then
  TARGETS=("$@")
else
  TARGETS=("$ROOT/index.html" "$ROOT/404.html" "$ROOT/ops/index.html")
fi

for TARGET in "${TARGETS[@]}"; do
  if [[ ! -f "$TARGET" ]]; then
    echo "stamp-build: skip missing $TARGET" >&2
    continue
  fi
  python3 - "$TARGET" "$REV" "$BUILT" "$VERSION" "$META" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
rev, built, version, meta = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
text = path.read_text(encoding="utf-8")
changed = False

pattern = re.compile(r"(<!--BUILD_ID-->)(.*?)(<!--/BUILD_ID-->)", re.DOTALL)
if pattern.search(text):
    text, n = pattern.subn(rf"\1{meta}\3", text, count=1)
    if n:
        changed = True

# Attribute stamps on .ea-build-id
def set_attr(html: str, name: str, value: str) -> str:
    # data-rev="..."
    pat = re.compile(rf'(data-{name}=)(["\'])(.*?)\2')
    if pat.search(html):
        return pat.sub(rf"\1\2{value}\2", html, count=1)
    return html

new_text = text
new_text = set_attr(new_text, "rev", rev)
new_text = set_attr(new_text, "built-utc", built)
new_text = set_attr(new_text, "version", version)

# Visible sub-spans if present
new_text = re.sub(
    r'(class="ea-build-id__rev">)(.*?)(</span>)',
    rf"\1{rev}\3",
    new_text,
    count=1,
    flags=re.DOTALL,
)
new_text = re.sub(
    r'(class="ea-build-id__ver">)(.*?)(</span>)',
    rf"\1{version}\3",
    new_text,
    count=1,
    flags=re.DOTALL,
)
new_text = re.sub(
    r'(class="ea-build-id__time"[^>]*datetime=")([^"]*)(">)(.*?)(</time>)',
    rf"\1{built}\3{built}\5",
    new_text,
    count=1,
    flags=re.DOTALL,
)

if new_text == text and not changed:
    # still write if only attrs path without BUILD_ID markers
    if 'data-rev=' not in text and '<!--BUILD_ID-->' not in text:
        sys.stderr.write(f"stamp-build: no BUILD_ID markers or data-rev in {path}\n")
        sys.exit(1)

path.write_text(new_text, encoding="utf-8")
print(f"stamped {path}: {meta}")
PY
done
