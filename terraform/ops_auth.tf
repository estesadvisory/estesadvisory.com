# Private portfolio ops dashboard at /ops/* — HTTP Basic Auth via CloudFront Function.
# No cookies. Credentials live in Secrets Manager; expected Basic token is baked into
# the function at apply time (CloudFront Functions cannot call Secrets Manager at runtime).

resource "random_password" "ops_basic" {
  length  = 24
  special = false
}

resource "aws_secretsmanager_secret" "ops_dashboard" {
  name                    = "${var.project_name}/ops-dashboard-basic"
  description             = "HTTP Basic Auth for https://${var.domain_name}/ops/ (portfolio dashboard)"
  recovery_window_in_days = 7

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "ops-dashboard-auth"
  }
}

resource "aws_secretsmanager_secret_version" "ops_dashboard" {
  secret_id = aws_secretsmanager_secret.ops_dashboard.id
  secret_string = jsonencode({
    username = var.ops_basic_username
    password = random_password.ops_basic.result
    realm    = "Estes Advisory Ops"
    path     = "/ops/"
  })
}

locals {
  ops_basic_b64 = base64encode("${var.ops_basic_username}:${random_password.ops_basic.result}")
}

resource "aws_cloudfront_function" "ops_basic_auth" {
  name    = "${var.project_name}-ops-basic-auth"
  runtime = "cloudfront-js-2.0"
  comment = "Basic Auth + www redirect + /ops index rewrite"
  publish = true
  code = templatefile("${path.module}/functions/ops_basic_auth.js", {
    apex_domain = var.domain_name
    www_domain  = local.www_domain
    basic_b64   = local.ops_basic_b64
  })
}

# Never cache authenticated private HTML/JSON (Authorization not in cache key by default).
data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}
