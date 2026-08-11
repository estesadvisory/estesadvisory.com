# Archive — ScopeHawk customer card (delisted from public site)

**Status:** DELISTED from https://estesadvisory.com (issue #67).  
**Do not restore to deployable site surfaces without explicit human instruction.**

## Why this exists

The ScopeHawk / getscopehawk.com customer card was removed from the **live static site** for organizational risk control. Content is retained here (outside the S3 deploy allowlist) so it can be restored later if leadership explicitly approves.

## What is here

| File | Contents |
|------|----------|
| `customer-card.html.fragment` | Exact former `index.html` customer card markup |
| `scopehawk.png` | Former logo at `/assets/customers/scopehawk.png` |
| This README | Restore policy |

## Not on the public site

- Path is under `docs/` — **not** included in `make deploy` / GitHub Actions `aws s3 sync` allowlist.
- Active blocklist: `docs/PUBLIC_BRAND_GUARDRAILS.md` + `scripts/brand-guard.sh`.

## Restore procedure (human-gated)

1. Human opens a new issue: lift ScopeHawk block + explicit “restore to site” acceptance.
2. Remove or update the ScopeHawk entry in `docs/PUBLIC_BRAND_GUARDRAILS.md` **in that same PR** after human approval in the issue.
3. Copy logo back to `assets/customers/scopehawk.png`.
4. Re-insert card into `index.html` customers section (renumber CST-* as needed).
5. Confirm `scripts/brand-guard.sh` passes only after the blocklist entry is intentionally removed.
6. PR → review → merge → deploy → live smoke.

## Related durable sources

- Private product hub: https://github.com/estesadvisory/ScopeHawk  
- Artifactum prefix: `ScopeHawk.*`  
- Site delist record: Artifactum `EstesAdvisory.site.customers.scopehawk-delisted`
