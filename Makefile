# Estes Advisory static site — infra + content deploy helpers
# Requires: terraform, aws CLI (SSO profile)

SHELL := /bin/bash
.DEFAULT_GOAL := help

TF_DIR       := terraform
AWS_PROFILE  ?= mike
AWS_REGION   ?= us-east-1
SITE_ROOT    := .

BUCKET       ?= $(shell cd $(TF_DIR) && terraform output -raw site_bucket_name 2>/dev/null)
DISTRIBUTION ?= $(shell cd $(TF_DIR) && terraform output -raw cloudfront_distribution_id 2>/dev/null)
SITE_URL     ?= $(shell cd $(TF_DIR) && terraform output -raw site_url 2>/dev/null)

export AWS_PROFILE AWS_REGION

.PHONY: help
help: ## Show targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: tf-bootstrap-backend
tf-bootstrap-backend: ## Create S3 state bucket + DynamoDB lock (bootstrap local state)
	cd $(TF_DIR)/bootstrap && terraform init && terraform apply

.PHONY: tf-init
tf-init: ## terraform init (S3 backend)
	cd $(TF_DIR) && terraform init

.PHONY: tf-migrate-state
tf-migrate-state: ## Migrate local site state to S3 backend (interactive)
	@test -f $(TF_DIR)/terraform.tfstate || (echo "No local $(TF_DIR)/terraform.tfstate to migrate"; exit 1)
	cp $(TF_DIR)/terraform.tfstate "$(TF_DIR)/terraform.tfstate.bak.$$(date +%Y%m%d%H%M%S)"
	cd $(TF_DIR) && terraform init -migrate-state

.PHONY: tf-validate
tf-validate: ## terraform validate
	cd $(TF_DIR) && terraform validate

.PHONY: tf-plan
tf-plan: ## terraform plan → terraform/tfplan
	cd $(TF_DIR) && terraform plan -out=tfplan

.PHONY: tf-apply
tf-apply: ## terraform apply (uses tfplan if present)
	@if [ -f $(TF_DIR)/tfplan ]; then \
	  cd $(TF_DIR) && terraform apply tfplan && rm -f tfplan; \
	else \
	  cd $(TF_DIR) && terraform apply; \
	fi

.PHONY: tf-output
tf-output: ## Show terraform outputs
	cd $(TF_DIR) && terraform output

# Site content allowlist only — never sync repo/tooling paths into the origin bucket (#20).
# BUCKET must come from terraform output (make status); do not override to a non-site bucket.
SITE_SYNC_EXCLUDES := \
	--exclude "*" \
	--include "*.html" \
	--include "css/*" \
	--include "js/*" \
	--include "assets/*" \
	--include "robots.txt" \
	--include "sitemap.xml"

.PHONY: stamp
stamp: ## Stamp footer build id (git SHA + UTC) into index.html
	@bash scripts/stamp-build.sh

.PHONY: sync
sync: stamp ## Stamp build id, then sync allowlisted files to S3
	@test -n "$(BUCKET)" || (echo "BUCKET empty — run make tf-apply first"; exit 1)
	# Allowlist + --delete: only known site paths land in the bucket; other keys are removed.
	# Cache: short TTL without immutable for unfingerprinted paths (#23).
	aws s3 sync $(SITE_ROOT)/ s3://$(BUCKET)/ \
	  --delete \
	  $(SITE_SYNC_EXCLUDES) \
	  --cache-control "public,max-age=300,must-revalidate"
	# Ensure correct Content-Type on key paths (sync may mis-detect some types).
	aws s3 cp s3://$(BUCKET)/ s3://$(BUCKET)/ --recursive \
	  --exclude "*" \
	  --include "*.html" \
	  --metadata-directive REPLACE \
	  --cache-control "public,max-age=300,must-revalidate" \
	  --content-type "text/html; charset=utf-8"
	aws s3 cp s3://$(BUCKET)/robots.txt s3://$(BUCKET)/robots.txt \
	  --metadata-directive REPLACE \
	  --cache-control "public,max-age=300,must-revalidate" \
	  --content-type "text/plain; charset=utf-8"
	aws s3 cp s3://$(BUCKET)/sitemap.xml s3://$(BUCKET)/sitemap.xml \
	  --metadata-directive REPLACE \
	  --cache-control "public,max-age=300,must-revalidate" \
	  --content-type "application/xml; charset=utf-8"
	@if [ -d "$(SITE_ROOT)/css" ]; then \
	  aws s3 cp s3://$(BUCKET)/css/ s3://$(BUCKET)/css/ --recursive \
	    --metadata-directive REPLACE \
	    --cache-control "public,max-age=300,must-revalidate" \
	    --content-type "text/css; charset=utf-8"; \
	fi
	@if [ -d "$(SITE_ROOT)/js" ]; then \
	  aws s3 cp s3://$(BUCKET)/js/ s3://$(BUCKET)/js/ --recursive \
	    --metadata-directive REPLACE \
	    --cache-control "public,max-age=300,must-revalidate" \
	    --content-type "application/javascript; charset=utf-8"; \
	fi
	@echo "Synced allowlisted paths to s3://$(BUCKET)/"

.PHONY: invalidate
invalidate: ## CloudFront invalidation for /*
	@test -n "$(DISTRIBUTION)" || (echo "DISTRIBUTION empty — run make tf-apply first"; exit 1)
	aws cloudfront create-invalidation --distribution-id $(DISTRIBUTION) --paths "/*"
	@echo "Invalidation submitted for $(DISTRIBUTION)"

.PHONY: deploy
deploy: sync invalidate ## Sync site content + invalidate CDN
	@echo "Deployed. Site: $(SITE_URL)"

.PHONY: smoke
smoke: ## Quick HTTPS smoke checks
	@url="$(SITE_URL)"; \
	test -n "$$url" || url="https://estesadvisory.com"; \
	echo "GET $$url"; \
	curl -sS -o /dev/null -w "  apex  %{http_code}  ssl_verify=%{ssl_verify_result}\n" "$$url" || true; \
	curl -sS -o /dev/null -w "  http→ %{http_code}  loc=%{redirect_url}\n" --max-redirs 0 "http://estesadvisory.com/" || true; \
	curl -sS -o /dev/null -w "  www→  %{http_code}  loc=%{redirect_url}\n" --max-redirs 0 "https://www.estesadvisory.com/" || true; \
	curl -sS -o /dev/null -w "  book  %{http_code}\n" "https://estesadvisory.com/book.html" || true; \
	curl -sS -o /dev/null -w "  css   %{http_code}\n" "https://estesadvisory.com/css/styles.css" || true

.PHONY: status
status: ## Print bucket / distribution / URL
	@echo "BUCKET=$(BUCKET)"
	@echo "DISTRIBUTION=$(DISTRIBUTION)"
	@echo "SITE_URL=$(SITE_URL)"
