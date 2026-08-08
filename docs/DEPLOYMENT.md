# Deployment — estesadvisory.com

Production static site on **S3 + CloudFront + ACM + Route53**, managed with Terraform.

Related: epic [#4](https://github.com/estesadvisory/estesadvisory.com/issues/4) (production site — **complete**).

## Architecture

| Piece | Role |
|--------|------|
| S3 bucket `estesadvisory.com` | Private origin (no public ACLs) |
| CloudFront OAC | Signed origin access only |
| ACM (us-east-1) | TLS for apex + `www` |
| CloudFront | HTTPS CDN, security headers, compression |
| Route53 zone `Z0628734KB79OZ2T16SR` | Apex + www alias A/AAAA → CloudFront |
| S3 `estesadvisory.com-cf-logs` | CloudFront standard access logs (private, 90-day lifecycle) |

Existing **MX → Google** and Google verification CNAMEs are left untouched.

## Prerequisites

- AWS SSO profile with admin (default: `mike`, account `990207457148`)
- Terraform ≥ 1.6
- AWS CLI v2

```bash
export AWS_PROFILE=mike
aws sso login
aws sts get-caller-identity
```

## First-time infra

```bash
make tf-init
make tf-plan    # review terraform/tfplan
make tf-apply
make tf-output
```

ACM DNS validation is automatic via Route53 (can take a few minutes).

### DNS cutover checklist

Terraform manages **only**:

- ACM DNS validation CNAMEs
- Apex + `www` **A/AAAA alias** records → CloudFront

It does **not** modify MX, existing TXT, or unrelated CNAMEs (e.g. Google verification).

Before first apply (or if apply fails on record conflicts):

1. List apex/www records:  
   `aws route53 list-resource-record-sets --hosted-zone-id Z0628734KB79OZ2T16SR --query "ResourceRecordSets[?Name=='estesadvisory.com.' || Name=='www.estesadvisory.com.']"`
2. Remove or **import** any existing apex/www **A / AAAA / CNAME** that is not managed by this state (Route53 rejects conflicting duplicates).
3. Confirm **MX → Google** (and any mail-related TXT) remain after apply.
4. Optional: lower TTL on old records ahead of cutover if they already exist.
5. **Canonical host is apex** (`https://estesadvisory.com`). `www` still has DNS A/AAAA → CloudFront; a CloudFront Function returns **301** to apex (path + query preserved).

### Terraform state (where it lives)

Two stacks, two storage locations ([#12](https://github.com/estesadvisory/estesadvisory.com/issues/12), [#29](https://github.com/estesadvisory/estesadvisory.com/issues/29)):

| Stack | Path | State storage | Notes |
|--------|------|----------------|--------|
| **Site** (CDN, S3 site, DNS, OIDC role, …) | `terraform/` | **Remote S3** | Source of truth |
| **Bootstrap** (creates state bucket + lock table) | `terraform/bootstrap/` | **Local file** | Chicken-and-egg; backup the laptop copy |

**Site stack remote details:**

| Item | Value |
|------|--------|
| Bucket | `estesadvisory-com-tfstate` (private, versioned, SSE-S3) |
| Key | `estesadvisory.com/terraform.tfstate` |
| Full URI | `s3://estesadvisory-com-tfstate/estesadvisory.com/terraform.tfstate` |
| Region | `us-east-1` |
| Lock | DynamoDB table `estesadvisory-com-tf-lock` |
| Account | `990207457148` |
| Config | `terraform/versions.tf` → `backend "s3" { ... }` |

```bash
# Confirm remote object exists
aws s3 ls s3://estesadvisory-com-tfstate/estesadvisory.com/

# Site stack always uses remote backend after init
cd terraform && terraform init && terraform plan
```

After a successful migrate, a local `terraform/terraform.tfstate` may remain as an empty stub — **do not treat it as source of truth**. Prefer deleting local site `*.tfstate` once you have confirmed S3 has the object (keep any `*.bak*` offline backup if you want).

**Bootstrap** state stays at `terraform/bootstrap/terraform.tfstate` on the machine that ran bootstrap apply. Do not commit it. If that file is lost, re-import or recreate the bucket/table carefully (they may already exist).

**First-time / migration (already done for prod):**

```bash
# 1) Bootstrap backend resources (local state in bootstrap/ only)
cd terraform/bootstrap
terraform init && terraform apply

# 2) Migrate site stack state from local → S3
cd ..
cp terraform.tfstate "terraform.tfstate.bak.$(date +%Y%m%d)"
terraform init -migrate-state   # or: terraform init -migrate-state -force-copy
terraform plan                  # expect no unexpected changes
```

- Never commit `*.tfstate` (bootstrap or site) — gitignored.
- Providers pin `allowed_account_ids` to `990207457148`.

## Content deploy (iterative)

Two supported paths — **prefer Actions after merge; keep laptop deploy as backup.**

| Path | Trigger | Notes |
|------|---------|--------|
| **Primary — GitHub Actions** | Push/merge to `main` (site paths) or **Actions → Deploy site → Run workflow** | OIDC role; stamps footer; no Terraform |
| **Backup — laptop** | `make deploy` with `AWS_PROFILE=mike` SSO | Same allowlist + invalidation; use when Actions is red or you need an immediate fix |

After infra exists (laptop):

```bash
make deploy     # stamp + s3 sync + CloudFront invalidation /*
```

Or step by step:

```bash
make sync
make invalidate
make smoke
```

### What gets uploaded

**Source of truth:** the `SITE_SYNC_EXCLUDES` allowlist in the root `Makefile` (`make sync`).

Allowlisted paths only (everything else is ignored and removed from the bucket via `--delete`):

- `*.html` (e.g. `index.html`, `book.html`, `404.html`)
- `css/*`, `js/*`, `assets/*`
- `robots.txt`, `sitemap.xml`, `favicon.ico`, `site.webmanifest`
- **`ops/**`** only when `OPS_SYNC=1` (laptop) or repo var `OPS_SYNC=true` (Actions) — private dashboard after CloudFront Basic Auth; see [OPS_DASHBOARD.md](./OPS_DASHBOARD.md)

Not uploaded: `terraform/`, `Makefile`, `README.md`, `docs/`, `.git/`, `.github/`, env/secret files, etc.

`BUCKET` must come from `terraform output` / `make status` — never point `make deploy` at a non-site bucket.

**Cache-Control (unfingerprinted paths):** `public,max-age=300,must-revalidate` for HTML, CSS, JS, and assets (no `immutable`). Pair with CloudFront invalidation on deploy. Long-lived immutable cache is only safe once filenames are content-hashed (see #23).

## Day-2 loop

1. Edit HTML/CSS/JS locally  
2. Preview: `python3 -m http.server 8765`  
3. Commit / open PR / merge to `main`  
4. Confirm **Deploy site** Actions run succeeds (primary)  
5. If Actions fails or you need an immediate push: `export AWS_PROFILE=mike && make deploy` then `make smoke`  

Do **not** treat GitHub Pages as production. Canonical host is apex via CloudFront.

### Build identity (footer)

Public footer (right of copyright) is stamped at **deploy time**, not hand-edited:

```text
rev <7-char-sha> · built <YYYY-MM-DDTHH:MM:SSZ>
```

- Script: `scripts/stamp-build.sh` (markers `<!--BUILD_ID-->…<!--/BUILD_ID-->` in `index.html` and `404.html`)
- Local: `make stamp` or automatically via `make sync` / `make deploy`
- CI: **Deploy site** workflow runs stamp before S3 sync
- Repo source keeps `rev pending · built pending` until the next stamp; stamped values are not committed back from Actions

### GitHub Actions content deploy (OIDC)

**Flow:** open PR → **merge to `main`** → Actions stamps build id, syncs allowlisted static files to S3, invalidates CloudFront.  
Not: deploy on every open PR. **Not:** Terraform apply (infra stays `make tf-plan` / `tf-apply` on a machine with SSO).

Workflow: `.github/workflows/deploy-site.yml`  
Triggers: push to `main` (ignores pure `terraform/**` / `docs/**` / README-only changes), or **Actions → Deploy site → Run workflow**.

| GitHub setting | Value |
|----------------|--------|
| Repo variable `AWS_GHA_DEPLOY_ROLE_ARN` | `arn:aws:iam::990207457148:role/estesadvisory-com-gha-site-deploy` |

**Reliability notes (#45):**
- Job does **not** use a GitHub Environment (env protection correlated with long queue / cancel).
- `timeout-minutes: 15` and concurrency `deploy-site-production` (cancel in-progress).
- OIDC role trust still allows `environment:production` if re-added later; not required for the job today.
- **Laptop backup is intentional and documented** — same allowlist as Actions; use when CI is red/stuck or for emergency content.

Role trust is limited to `estesadvisory/estesadvisory.com` (`main` ref). Permissions: site bucket object R/W + CloudFront invalidation only.

**Known-good rule:** If you are unsure which deploy path ran last, check footer `rev` on https://estesadvisory.com and the latest **Deploy site** workflow run. Laptop `make deploy` stamps the local git SHA at deploy time.

## Outputs

```bash
make status
# or
cd terraform && terraform output
```

- `site_url` — https://estesadvisory.com  
- `cloudfront_distribution_id` — invalidations  
- `site_bucket_name` — S3 sync target  

## Destroy / empty origin bucket

Site objects and versions are **not** managed by Terraform (`make sync` owns content). The bucket has versioning on and **no** `force_destroy`.

Before `terraform destroy` (or if destroy fails on a non-empty bucket):

1. Empty current objects: `aws s3 rm s3://$(make -s status | sed -n 's/^BUCKET=//p') --recursive` (or use the bucket name from `make status`)
2. Delete all object versions and delete markers (Console → bucket → Management → empty, or scripted `list-object-versions` + delete)
3. Then `cd terraform && terraform destroy`

Lifecycle: noncurrent versions expire after **30 days**; incomplete multipart uploads abort after **7 days** (#24).


### GitHub Pages (disable if still enabled)

Production is **S3 + CloudFront only**. If the repo still runs the automatic
“pages build and deployment” workflow, turn Pages off so it is not confused
with production deploys ([#38](https://github.com/estesadvisory/estesadvisory.com/issues/38)):

1. GitHub → **Settings → Pages**
2. **Build and deployment → Source** → **None** (or disable GitHub Pages)
3. Confirm no further “pages build and deployment” runs on push to `main`

Canonical site: `https://estesadvisory.com`

### Analytics (Plausible)

Privacy-first analytics — **not** Google Analytics ([#47](https://github.com/estesadvisory/estesadvisory.com/issues/47)).

- Script: `https://plausible.io/js/script.outbound-links.js` (pageviews + outbound clicks, e.g. Cal.com)
- Domain: `data-domain="estesadvisory.com"`
- No cookies; GDPR-friendly by design

**Operator setup:** create a site for `estesadvisory.com` at [plausible.io](https://plausible.io) (or self-hosted equivalent). Until the domain is registered in your Plausible account, the script loads but does not record under your dashboard.

CloudFront access logs remain available for server-side traffic forensics (separate from product analytics).

## HSTS

CloudFront response headers send `Strict-Transport-Security` with `max-age=31536000` on the site host only. **v1 does not** set `includeSubDomains` or `preload` ([#18](https://github.com/estesadvisory/estesadvisory.com/issues/18)). Revisit before adding non-HTTPS subdomains or submitting to the browser preload list.

## Canonical host

- **Primary:** `https://estesadvisory.com` (apex)
- **www:** DNS still points at the same distribution; CloudFront Function `www-to-apex` issues **301** to the apex URL with the same path and query string
- Sitemap and `<link rel="canonical">` use the apex host only

## Notes

- Do not commit `*.tfstate` or `terraform.tfvars` with secrets (none required for v1).
### CloudFront access logs

Standard logging writes to `s3://estesadvisory.com-cf-logs/cloudfront/` (see `terraform output cf_logs_bucket_name`). Bucket is private, encrypted, and expires objects after **90 days**. Log delivery uses S3 ACLs (`BucketOwnerPreferred` + CloudFront log-delivery canonical user) — do not switch that bucket to `BucketOwnerEnforced` without changing the delivery model.
