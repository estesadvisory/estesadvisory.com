# Deployment — estesadvisory.com

Production static site on **S3 + CloudFront + ACM + Route53**, managed with Terraform.

Related issues: epic [#4](https://github.com/estesadvisory/estesadvisory.com/issues/4).

## Architecture

| Piece | Role |
|--------|------|
| S3 bucket `estesadvisory.com` | Private origin (no public ACLs) |
| CloudFront OAC | Signed origin access only |
| ACM (us-east-1) | TLS for apex + `www` |
| CloudFront | HTTPS CDN, security headers, compression |
| Route53 zone `Z0628734KB79OZ2T16SR` | Apex + www alias A/AAAA → CloudFront |

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

## Content deploy (iterative)

After infra exists:

```bash
make deploy     # s3 sync + CloudFront invalidation /*
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
- `robots.txt`, `sitemap.xml`

Not uploaded: `terraform/`, `Makefile`, `README.md`, `docs/`, `.git/`, `.github/`, env/secret files, etc.

`BUCKET` must come from `terraform output` / `make status` — never point `make deploy` at a non-site bucket.

**Cache-Control (unfingerprinted paths):** `public,max-age=300,must-revalidate` for HTML, CSS, JS, and assets (no `immutable`). Pair with CloudFront invalidation on deploy. Long-lived immutable cache is only safe once filenames are content-hashed (see #23).

## Day-2 loop

1. Edit HTML/CSS/JS locally  
2. Preview: `python3 -m http.server 8765`  
3. Commit / PR as usual  
4. `make deploy` from a machine with AWS SSO  

Optional later: GitHub Actions OIDC deploy ([#11](https://github.com/estesadvisory/estesadvisory.com/issues/11)).

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

## Notes

- **www** currently serves the same content as apex (canonical 301 is [#5](https://github.com/estesadvisory/estesadvisory.com/issues/5)).
- State is **local** under `terraform/` (gitignored). Remote state is [#12](https://github.com/estesadvisory/estesadvisory.com/issues/12).
- Do not commit `*.tfstate` or `terraform.tfvars` with secrets (none required for v1).
