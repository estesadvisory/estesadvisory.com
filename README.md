# estesadvisory.com

Static website for **Estes Advisory LLC** — blueprint design, production deploy on AWS.

## Local preview

```bash
python3 -m http.server 8765
# → http://127.0.0.1:8765
```

## Production deploy

Infra + CDN: **S3 (private) → CloudFront (HTTPS) → Route53** via Terraform.

```bash
export AWS_PROFILE=mike
aws sso login

make tf-init && make tf-plan && make tf-apply   # first time / infra changes
make deploy                                     # content sync + invalidate
make smoke
```

Full details: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Production is CloudFront, not GitHub Pages.** If Settings → Pages is still on, set Source to **None** so automatic Pages builds do not look like deploys.

## Layout

| Path | Purpose |
|------|---------|
| `index.html`, `book.html`, `404.html` | Pages |
| `css/`, `js/`, `assets/` | Static assets |
| `terraform/` | S3, ACM, CloudFront, Route53 |
| `Makefile` | `deploy`, `tf-*`, `smoke` |

## Tracking

Epic: [Production static site (#4)](https://github.com/estesadvisory/estesadvisory.com/issues/4).
