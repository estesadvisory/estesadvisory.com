locals {
  www_domain   = "www.${var.domain_name}"
  aliases      = var.enable_www ? [var.domain_name, local.www_domain] : [var.domain_name]
  s3_origin_id = "s3-${var.bucket_name}"
}
