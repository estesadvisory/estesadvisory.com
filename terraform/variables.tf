variable "aws_region" {
  description = "Primary AWS region for S3 and most resources. ACM for CloudFront is always us-east-1."
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account ID allowed for Terraform applies (guards wrong SSO account)."
  type        = string
  default     = "990207457148"
}

variable "environment" {
  description = "Environment name used for tagging."
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Short project name for tags and some resource names."
  type        = string
  default     = "estesadvisory-com"
}

variable "domain_name" {
  description = "Apex domain for the site."
  type        = string
  default     = "estesadvisory.com"
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for domain_name."
  type        = string
  default     = "Z0628734KB79OZ2T16SR"
}

variable "bucket_name" {
  description = "S3 origin bucket name. Must be globally unique. Defaults to the apex domain."
  type        = string
  default     = "estesadvisory.com"
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "enable_www" {
  description = "Also attach www.<domain> as a CloudFront alias and Route53 records."
  type        = bool
  default     = true
}

variable "cf_logs_bucket_name" {
  description = "S3 bucket for CloudFront standard access logs (must be globally unique)."
  type        = string
  default     = "estesadvisory.com-cf-logs"
}

variable "cf_logs_retention_days" {
  description = "Days to retain CloudFront access logs before lifecycle expiration."
  type        = number
  default     = 90
}

variable "github_repository" {
  description = "GitHub org/repo allowed to assume the GHA deploy role via OIDC (e.g. estesadvisory/estesadvisory.com)."
  type        = string
  default     = "estesadvisory/estesadvisory.com"
}
