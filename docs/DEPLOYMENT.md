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

Included: `index.html`, `book.html`, `404.html`, `css/`, `js/`, `assets/`, `robots.txt`, `sitemap.xml`.

Excluded: `.git/`, `terraform/`, `Makefile`, `README.md`, `docs/`.

Cache: long-lived for assets; ~5 minutes for HTML.

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

## Notes

- **www** currently serves the same content as apex (canonical 301 is [#5](https://github.com/estesadvisory/estesadvisory.com/issues/5)).
- State is **local** under `terraform/` (gitignored). Remote state is [#12](https://github.com/estesadvisory/estesadvisory.com/issues/12).
- Do not commit `*.tfstate` or `terraform.tfvars` with secrets (none required for v1).
