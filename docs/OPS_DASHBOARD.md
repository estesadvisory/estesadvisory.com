# Private portfolio ops dashboard (`/ops/`)

Internal business dashboard on the production apex domain. **Not linked** from the public marketing site.

| Item | Value |
|------|--------|
| URL | https://estesadvisory.com/ops/ |
| Auth | HTTP **Basic Auth** (CloudFront Function) — **no cookies** |
| User | Secrets Manager `estesadvisory-com/ops-dashboard-basic` (`username` + `password`) |
| Data | `ops/data/*-scoreboard.json` + `ops/reports/*-scoreboard.md` (synced from portfolio-ops) |

## Security model

- Path obscurity is **not** security; Basic Auth is required on `/ops` and `/ops/*`.
- Cache policy for ops behaviors is **CachingDisabled** so authorized responses are not shared.
- Origin objects use `Cache-Control: private,no-store`.
- `robots.txt` disallows `/ops`; page has `noindex,nofollow`.
- Do not add nav links from `index.html` / sitemap.

## Deploy gate

Content under `ops/` is **excluded** from S3 sync until:

1. Terraform ops Basic Auth is applied (`make tf-apply`)
2. Laptop: `make deploy-ops` (sets `OPS_SYNC=1`)
3. Actions: repo variable `OPS_SYNC=true` on `estesadvisory/estesadvisory.com`

Without the gate, `*.html` would publish `ops/index.html` publicly.

## Refresh data

```bash
export AWS_PROFILE=mike
# From estesadvisory.com repo:
make ops-data          # copy scoreboards from ../portfolio-ops
make deploy            # or: make deploy-ops (ops-data + deploy)
```

Retrieve credentials:

```bash
make ops-password
# or
aws secretsmanager get-secret-value \
  --secret-id estesadvisory-com/ops-dashboard-basic \
  --query SecretString --output text
```

## Infra

Terraform (`ops_auth.tf` + CloudFront ordered behaviors):

- Generates password into Secrets Manager on first apply
- Injects `Basic <base64(user:pass)>` into CloudFront Function at apply time
- Function also 301s www→apex and rewrites `/ops` → `/ops/index.html`

```bash
make tf-plan
make tf-apply
make tf-output   # ops_dashboard_url, ops_dashboard_secret_arn
```

## Local preview (no Basic Auth)

```bash
make ops-data
python3 -m http.server 8765
# open http://127.0.0.1:8765/ops/
```

## Charts / markdown

- **Chart.js** (CDN) for commits, categories, PRs
- **marked** (CDN) for Layer C narrative markdown
- Manifest: `ops/data/manifest.json` lists available weeks
