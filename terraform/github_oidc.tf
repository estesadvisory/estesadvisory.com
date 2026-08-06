# GitHub Actions OIDC → AWS role for content deploy (#11).
# No long-lived access keys.

data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub Actions OIDC CA thumbprints (AWS docs / GitHub).
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

locals {
  github_repo = var.github_repository # e.g. estesadvisory/estesadvisory.com
}

data "aws_iam_policy_document" "gha_assume" {
  statement {
    sid     = "GitHubActionsOidc"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${local.github_repo}:ref:refs/heads/main",
        "repo:${local.github_repo}:environment:production",
      ]
    }
  }
}

resource "aws_iam_role" "gha_site_deploy" {
  name               = "${var.project_name}-gha-site-deploy"
  assume_role_policy = data.aws_iam_policy_document.gha_assume.json
  description        = "GitHub Actions OIDC role for static site content deploy"
}

data "aws_iam_policy_document" "gha_site_deploy" {
  statement {
    sid    = "S3SiteSync"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid    = "S3SiteObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:PutObjectAcl",
    ]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid    = "CloudFrontInvalidation"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:GetDistribution",
    ]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "gha_site_deploy" {
  name   = "site-content-deploy"
  role   = aws_iam_role.gha_site_deploy.id
  policy = data.aws_iam_policy_document.gha_site_deploy.json
}
