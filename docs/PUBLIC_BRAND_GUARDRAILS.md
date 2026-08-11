# Public brand guardrails — estesadvisory.com

**Audience:** humans + agents working on this public marketing site.  
**Canonical live host:** https://estesadvisory.com

## Purpose

Prevent **accidental re-publication** of names, logos, or links that create organizational, client, or legal risk. Removal from the site is **not** deletion of private project memory (GitHub private repos, Artifactum).

## Active public-site blocklist

These strings/entities must **not** appear on **deployable** site surfaces until a human **explicitly** lifts the block in a dedicated issue + PR.

Deployable surfaces = what ships to S3 (see Makefile / deploy workflow allowlist):

- `*.html` at repo root (and any HTML that is not under excluded paths)
- `css/`, `js/`, `assets/`
- `robots.txt`, `sitemap.xml`, `favicon.ico`, `site.webmanifest`

| Entity | Patterns (case-insensitive) | Reason | Since | Restore gate |
|--------|----------------------------|--------|-------|--------------|
| ScopeHawk / getscopehawk.com | `getscopehawk`, `scopehawk`, `scopehawk.png` | Org risk — delisted from public customers | 2026-08-10 · #67 | Explicit human issue that removes this row + restore PR |

**Allowed locations for blocked patterns (do not “clean” these away):**

- `docs/archive/**` — intentional offline archive
- `docs/PUBLIC_BRAND_GUARDRAILS.md` — this file
- `scripts/brand-guard.sh` — enforcer
- Git history
- Private repos / Artifactum (not part of this site deploy)

Historical `ops/` scoreboard JSON may still mention project names; ops is **not** on the default public sync path. Do not promote those mentions into marketing HTML.

## Agent non-negotiables

1. **Never** re-add a blocklisted entity to deployable files during unrelated work (“while we’re here”, logo polish, customer grid tweaks).
2. **Never** “restore from archive” unless the human’s current message (or a linked open issue they opened for restore) **explicitly** authorizes it.
3. If a task would reintroduce a blocked pattern, **stop**, report the blocklist hit, and ask the human.
4. Commented-out HTML, `display:none`, or robots noindex is **not** acceptable for delist — content must be **absent** from deployable files.

## Enforcement

```bash
make brand-guard   # or: bash scripts/brand-guard.sh
```

Runs in GitHub Actions **before** S3 sync so a bad merge cannot silently republish.

## Adding a new blocklist entry

1. Remove entity from deployable surfaces (full removal, not comments).
2. Optionally archive under `docs/archive/...` (outside deploy allowlist).
3. Add a row to the table above.
4. Extend patterns in `scripts/brand-guard.sh` if needed.
5. Issue + PR; mention org risk in the PR body.
