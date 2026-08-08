output "site_bucket_name" {
  description = "S3 origin bucket name."
  value       = aws_s3_bucket.site.id
}

output "site_bucket_arn" {
  description = "S3 origin bucket ARN."
  value       = aws_s3_bucket.site.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for invalidations)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (*.cloudfront.net)."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1."
  value       = aws_acm_certificate.site.arn
}

output "site_url" {
  description = "Primary HTTPS site URL."
  value       = "https://${var.domain_name}"
}

output "www_url" {
  description = "www HTTPS URL (if enabled)."
  value       = var.enable_www ? "https://${local.www_domain}" : null
}

output "cf_logs_bucket_name" {
  description = "S3 bucket receiving CloudFront standard access logs."
  value       = aws_s3_bucket.cf_logs.id
}

output "gha_site_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC content deploys."
  value       = aws_iam_role.gha_site_deploy.arn
}

output "ops_dashboard_url" {
  description = "Private portfolio dashboard URL (HTTP Basic Auth; no public links)."
  value       = var.ops_dashboard_enabled ? "https://${var.domain_name}/ops/" : null
}

output "ops_dashboard_secret_arn" {
  description = "Secrets Manager ARN for ops Basic Auth credentials."
  value       = var.ops_dashboard_enabled ? aws_secretsmanager_secret.ops_dashboard.arn : null
}

output "ops_dashboard_username" {
  description = "Basic Auth username for /ops/."
  value       = var.ops_dashboard_enabled ? var.ops_basic_username : null
}
