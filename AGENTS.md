# Agent instructions (estesadvisory.com)

This repository is the **local source of truth** for the Estes Advisory company site in the Grok CLI.
Web UI Grok Projects do **not** sync here. Continuity is: **disk + this file** (+ Memory MCP when used).

- **Local path:** `~/repos/estesadvisory.com`
- **GitHub:** https://github.com/estesadvisory/estesadvisory.com (public)

## What this repo is

Static website for **Estes Advisory LLC** — blueprint design, production on **S3 + CloudFront**. Live: https://estesadvisory.com

## Portfolio process (shared)

Cross-repo standards: **[estesadvisory/portfolio-ops](https://github.com/estesadvisory/portfolio-ops)**.

1. **Issue bodies** are source of truth; update bodies when closing.
2. **Priority in titles:** `[P0]`…`[P3]`; park as `[P3 / parked]` with unpark criteria.
3. **Small PRs**; `Refs #N` in commits when an issue exists.
4. **Review before merge** for infra/deploy-impacting changes; pure content/docs use judgment.
5. **Human owns** assignee and merge; disclose AI assistance when useful.
6. **Never** embed PATs/tokens in `git remote` URLs — clean HTTPS + `gh auth` keyring (or SSH).

## Repo-specific non-negotiables

1. **Canonical prod is CloudFront**, not GitHub Pages (Pages source should stay None).
2. **Deploy primary:** GitHub Actions on merge to `main`; laptop `make deploy` is backup — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).
3. **Verify after deploy** (`make smoke` / live URL); don’t claim success without check.
4. **Public brand:** careful with claims, partners, pricing; escalate legal/money/public brand to human.
5. **No secrets** in the static tree; AWS via SSO profile / Actions secrets only.
6. **Public brand blocklist** — [docs/PUBLIC_BRAND_GUARDRAILS.md](./docs/PUBLIC_BRAND_GUARDRAILS.md). Blocked entities (e.g. ScopeHawk / getscopehawk.com) must **not** appear on deployable site surfaces. Delist = full removal (not HTML comments / hidden CSS). Archive under `docs/archive/` is offline only. **Never restore a blocklisted customer or logo without explicit human instruction in the current task or a dedicated open issue.** Run `make brand-guard` before claiming site work is done.
7. **Privacy chrome:** toast → on-page `#privacy` → `/privacy.html`. See https://github.com/estesadvisory/portfolio-ops/blob/main/docs/SITE_PRIVACY.md

## Useful links

- [README.md](./README.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- Portfolio hub: https://github.com/estesadvisory/portfolio-ops
