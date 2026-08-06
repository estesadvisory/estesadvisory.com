terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80.0"
    }
  }

  # Bootstrap keeps *local* state intentionally (chicken-and-egg).
}
