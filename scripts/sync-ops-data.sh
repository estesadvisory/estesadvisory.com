#!/usr/bin/env bash
# Copy portfolio-ops scoreboard JSON + markdown into ops/data for the private dashboard.
# Usage:
#   PORTFOLIO_OPS_ROOT=~/repos/portfolio-ops bash scripts/sync-ops-data.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OPS_DATA="${ROOT}/ops/data"
OPS_REPORTS="${ROOT}/ops/reports"
PORTFOLIO_OPS_ROOT="${PORTFOLIO_OPS_ROOT:-${ROOT}/../portfolio-ops}"

if [[ ! -d "${PORTFOLIO_OPS_ROOT}/data" ]]; then
  echo "portfolio-ops data not found at: ${PORTFOLIO_OPS_ROOT}/data" >&2
  echo "Set PORTFOLIO_OPS_ROOT to your portfolio-ops clone." >&2
  exit 1
fi

mkdir -p "${OPS_DATA}" "${OPS_REPORTS}"

# Clear previous scoreboard snapshots (keep directory)
find "${OPS_DATA}" -type f \( -name '*-scoreboard.json' -o -name 'manifest.json' \) -delete 2>/dev/null || true
find "${OPS_REPORTS}" -type f -name '*-scoreboard.md' -delete 2>/dev/null || true

copied_json=0
for f in "${PORTFOLIO_OPS_ROOT}/data/"*-scoreboard.json; do
  [[ -f "$f" ]] || continue
  cp "$f" "${OPS_DATA}/"
  copied_json=$((copied_json + 1))
  base=$(basename "$f" .json)
  week="${base%-scoreboard}"
  md="${PORTFOLIO_OPS_ROOT}/reports/${base}.md"
  if [[ -f "$md" ]]; then
    cp "$md" "${OPS_REPORTS}/"
  fi
  # Also copy impact companion if present
  impact="${PORTFOLIO_OPS_ROOT}/reports/${week}-impact-human.md"
  if [[ -f "$impact" ]]; then
    cp "$impact" "${OPS_REPORTS}/"
  fi
done

if [[ "$copied_json" -eq 0 ]]; then
  echo "No *-scoreboard.json found under ${PORTFOLIO_OPS_ROOT}/data" >&2
  exit 1
fi

# Build manifest (newest week first by filename sort reverse)
python3 - <<'PY' "${OPS_DATA}" "${OPS_REPORTS}"
import json, sys
from pathlib import Path

data_dir = Path(sys.argv[1])
reports_dir = Path(sys.argv[2])
weeks = []
for p in sorted(data_dir.glob("*-scoreboard.json"), reverse=True):
    week_id = p.name.replace("-scoreboard.json", "")
    md_name = f"{week_id}-scoreboard.md"
    md_path = reports_dir / md_name
    entry = {
        "id": week_id,
        "label": week_id,
        "json": f"data/{p.name}",
        "md": f"reports/{md_name}" if md_path.exists() else None,
    }
    try:
        payload = json.loads(p.read_text())
        w = (payload.get("windows") or {}).get("calendar_week") or {}
        if w.get("start") and w.get("end"):
            entry["label"] = f"{week_id} ({w['start']} → {w['end']})"
        entry["generated_at"] = payload.get("generated_at")
    except Exception:
        pass
    weeks.append(entry)

manifest = {
    "schema_version": "1",
    "title": "Estes Advisory portfolio ops",
    "weeks": weeks,
}
(data_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Wrote manifest with {len(weeks)} week(s)")
for w in weeks:
    print(f"  - {w['id']}: {w['json']}" + (f" + {w['md']}" if w.get("md") else ""))
PY

echo "Ops data synced from ${PORTFOLIO_OPS_ROOT}"
