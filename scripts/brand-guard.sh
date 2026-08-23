#!/usr/bin/env bash
# Fail if public-site blocklisted entities appear on deployable surfaces.
# See docs/PUBLIC_BRAND_GUARDRAILS.md — restore requires explicit human + issue.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

# Patterns that must not ship to the public origin (case-insensitive).
# Archive under docs/ is intentionally not scanned.
BLOCK_PATTERNS=(
  'getscopehawk'
  'scopehawk'
  'getforgelens'
)

# Deployable paths (must match make deploy / GHA allowlist intent).
# - Root HTML only (not docs/, not ops/ HTML if present under ops)
# - assets, css, js, robots, sitemap, webmanifest
scan_list=()
while IFS= read -r f; do
  scan_list+=("$f")
done < <(
  find . -maxdepth 1 -type f \( -name '*.html' -o -name 'robots.txt' -o -name 'sitemap.xml' -o -name 'site.webmanifest' -o -name 'favicon.ico' \) 2>/dev/null
  find ./assets ./css ./js -type f 2>/dev/null || true
)

if [[ ${#scan_list[@]} -eq 0 ]]; then
  echo "brand-guard: no deployable files found — unexpected" >&2
  exit 2
fi

hits=0
for pat in "${BLOCK_PATTERNS[@]}"; do
  # Filenames (e.g. scopehawk.png)
  while IFS= read -r f; do
    echo "BLOCKED filename: ${f} (pattern: ${pat})" >&2
    hits=$((hits + 1))
  done < <(printf '%s\n' "${scan_list[@]}" | grep -i "${pat}" || true)

  # File contents (text-ish). Skip obvious binaries via grep -I / -a handled by -I.
  while IFS= read -r line; do
    echo "BLOCKED content: ${line}" >&2
    hits=$((hits + 1))
  done < <(grep -I -n -i -E "${pat}" "${scan_list[@]}" 2>/dev/null || true)
done

if [[ "${hits}" -gt 0 ]]; then
  echo "" >&2
  echo "brand-guard: FAILED (${hits} hit(s))." >&2
  echo "Public blocklist: docs/PUBLIC_BRAND_GUARDRAILS.md" >&2
  echo "Do not restore without explicit human instruction + issue." >&2
  exit 1
fi

echo "brand-guard: OK (scanned ${#scan_list[@]} deployable path(s); no blocklist hits)"
