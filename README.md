# estesadvisory.com

Static website for **Estes Advisory LLC** — blueprint design, production on **S3 + CloudFront**.

**Status:** production live at [https://estesadvisory.com](https://estesadvisory.com). Epic [#4](https://github.com/estesadvisory/estesadvisory.com/issues/4) is complete.

## Local preview

```bash
python3 -m http.server 8765
# → http://127.0.0.1:8765
```

## Content deploy (two paths)

| Path | When to use |
|------|-------------|
| **GitHub Actions** (primary) | Merge to `main` touching site files → stamps build id, S3 sync, CloudFront invalidation |
| **`make deploy`** (known-good backup) | Actions red/stuck, or you need an immediate laptop deploy with AWS SSO |

```bash
export AWS_PROFILE=mike
aws sso login

# Content (laptop backup)
make deploy
make smoke

# Infra only (never via Actions)
make tf-init && make tf-plan && make tf-apply
```

Full details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Production is CloudFront, not GitHub Pages.** Settings → Pages should stay **Source: None**.

## Layout

| Path | Purpose |
|------|---------|
| `index.html`, `book.html`, `404.html` | Pages (`book.html` → Cal.com only; keep for old links) |
| `css/`, `js/`, `assets/` | Static assets (`assets/og-share.png` = 1200×630 social card) |
| `terraform/` | S3, ACM, CloudFront, Route53, OIDC deploy role |
| `Makefile` | `deploy`, `tf-*`, `smoke` |
| `.github/workflows/deploy-site.yml` | Content deploy on `main` |

## Social parity (LinkedIn)

Use the same positioning as the site so inbound doesn’t feel like two brands:

| Surface | Copy |
|---------|------|
| Company tagline | Architect of Systems — cloud, data, AI, partnerships |
| Company about (short) | Estes Advisory helps leaders make clear decisions about cloud architecture, data strategy, AI production, and strategic partnerships — then stays close until the path is executable. Texas & California. |
| Primary CTA | Schedule: https://cal.com/estesadvisory · Site: https://estesadvisory.com |
| Personal headline (aligned) | Principal, Estes Advisory · Cloud, data & AI advisory |

Update the [company page](https://www.linkedin.com/company/estes-advisory/) and personal profile manually in LinkedIn — not deployable from this repo.

## Tracking

Epic [#4](https://github.com/estesadvisory/estesadvisory.com/issues/4) — closed (production site shipped). New work: open focused issues as needed.

## Private portfolio ops dashboard

Internal dashboard at **`/ops/`** (Basic Auth, no public links). See [docs/OPS_DASHBOARD.md](docs/OPS_DASHBOARD.md).

```bash
make ops-data     # sync scoreboards from ../portfolio-ops
make deploy-ops   # data + S3 + CloudFront (AWS SSO)
make ops-password # print Basic Auth credentials from Secrets Manager
```
