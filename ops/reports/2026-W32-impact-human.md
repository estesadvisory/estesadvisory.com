# W32 impact scoring — human-oriented overrides (Refs #12)

**Date:** 2026-08-08  
**Source auto list:** `data/2026-W32-pass2.json` → `shipped_high_impact` (heuristic over-ranked ~78 as high)  
**Status:** Agent draft for human amendment. Mark `impact_human` and re-score narrative.

## Method

| Label | Meaning |
|-------|---------|
| **H** | Changes capability, trust boundary, client commitment, or prod topology users feel |
| **M** | Real work; local or supporting |
| **L** | Chore, thin docs, epic bookkeeping child |
| **Epic** | Count once; children are M unless they alone ship user-visible risk/capability |

Auto `impact: high` on every rename child is **wrong** — score the **epic outcome** once.

## Portfolio narrative (recommended)

This week was primarily:

1. **H — Vault product + trust** (undelete, sensitive delete, auth surfaces, health sanitize, reaper, move)  
2. **H — Identity cutover** (AWS rename grok→Artifactum as one program)  
3. **H — Client/legal** (ScopeHawk TX handoff, LHB NDA) — much of this in MCP not issue-close counts  
4. **M — Marketing face** (artifactum.ai theme/logo/CTA)  
5. **M — Company site hygiene pack** (many QoL/ops closes; board cleared)  
6. **L/M — Process codification** (PHILOSOPHY/review/transparency) — high leverage for agents, low “feature” count  

## Override table (top auto-high items)

| Ref | Auto | **Human** | Rationale |
|-----|------|-----------|-----------|
| artifactum#111 AWS rename epic | H | **H** | One strategic cutover; children fold under this |
| artifactum#112–#118 rename children | H | **L** (or M for E/H security-ish) | Bookkeeping of #111; don’t count 7× high |
| artifactum#129 undelete | H | **H** | User/agent-visible capability |
| artifactum#126 sensitive delete | H | **H** | Trust / fail-safe |
| artifactum#94 dual-surface auth | H | **H** | Trust topology |
| artifactum#95 unauth monitoring | H | **M** | Supporting control |
| artifactum#96 health sanitize | H | **M–H** | Info disclosure fix; lean **H** if exposed in prod |
| artifactum#80 reaper | H | **H** | Lifecycle completeness |
| artifactum#87 move_content | H | **H** | Operability / case-fold program |
| artifactum#75–#76 URI/host binding | H | **H** | Security correctness |
| artifactum#77 bucket IAM bug | H | **H** | Real prod risk |
| artifactum#74 reject non-s3 URI | H | **M–H** | Security hardening |
| artifactum#106–#109 marketing site | H | **M** | Brand surface; not vault core |
| artifactum#108 layout bug | H | **L–M** | Polish |
| artifactum#123 guidance name matrix | H | **L** | Correctness chore |
| artifactum#91 custom MCP hostname | H | **M** | Platform enablement |
| artifactum#92 code rename follow-ups | H | **M** | Supports #111 |
| LHB NDA executed | (legal) | **H** | Client gate |
| ScopeHawk TX client PDF | (MCP) | **H** | Client deliverable |
| estesadvisory.com 38 closes | mixed | **M** overall | Strong hygiene pack; few net-new products |
| portfolio-ops hub + AGENTS unify | — | **H** (process) | Enables multi-repo operating system |
| mcp-ig park | — | **L** | Explicit non-work |

## Counting guidance for scoreboards

- Prefer **narrative H bullets** (8–15 max) over “78 high issues.”  
- Fold rename children into epic #111.  
- Include **MCP-only** client outcomes in Layer C even when git issue closes are zero.  
- Process docs that change agent behavior (#review, transparency) = **M or H process**, not feature spam.

## Human sign-off

- [ ] Agree with H narrative bullets above  
- [ ] Adjust any row in override table  
- [ ] Optional: merge into `data/2026-W32-pass2.json` as `impact_human` map later  

_Drafted by Grok Build on unify resume; human owns final scores._
