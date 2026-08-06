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

.PHONY: tf-init
tf-init: ## terraform init
	cd $(TF_DIR) && terraform init

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

.PHONY: sync
sync: ## Sync static files to S3 origin (no invalidate)
	@test -n "$(BUCKET)" || (echo "BUCKET empty — run make tf-apply first"; exit 1)
	# Single sync with --delete so excludes only drop non-site paths (never excludes HTML).
	aws s3 sync $(SITE_ROOT)/ s3://$(BUCKET)/ \
	  --delete \
	  --exclude ".git/*" \
	  --exclude ".gitignore" \
	  --exclude "terraform/*" \
	  --exclude "Makefile" \
	  --exclude "README.md" \
	  --exclude "docs/*" \
	  --exclude ".DS_Store" \
	  --exclude "*.tfvars" \
	  --exclude "*.tfvars.example" \
	  --cache-control "public,max-age=300,must-revalidate"
	# HTML + crawl files: short TTL so iterative deploys show up quickly.
	# Unfingerprinted CSS/JS/assets: short TTL without immutable (see #23).
	# Long-lived immutable cache is only safe once filenames are content-hashed.
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
	@echo "Synced to s3://$(BUCKET)/"

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
	curl -sS -o /dev/null -w "  www   %{http_code}\n" "https://www.estesadvisory.com/" || true; \
	curl -sS -o /dev/null -w "  book  %{http_code}\n" "https://estesadvisory.com/book.html" || true; \
	curl -sS -o /dev/null -w "  css   %{http_code}\n" "https://estesadvisory.com/css/styles.css" || true

.PHONY: status
status: ## Print bucket / distribution / URL
	@echo "BUCKET=$(BUCKET)"
	@echo "DISTRIBUTION=$(DISTRIBUTION)"
	@echo "SITE_URL=$(SITE_URL)"
