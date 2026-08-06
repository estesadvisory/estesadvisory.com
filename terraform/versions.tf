terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80.0"
    }
  }

  # Remote state + DynamoDB lock (#12). Bootstrap bucket/table once via terraform/bootstrap/.
  backend "s3" {
    bucket         = "estesadvisory-com-tfstate"
    key            = "estesadvisory.com/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "estesadvisory-com-tf-lock"
    encrypt        = true
  }
}
