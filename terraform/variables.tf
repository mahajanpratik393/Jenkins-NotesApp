variable "region" {
  description = "AWS region"
  default     = "ap-south-1"
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  default     = "ami-021a584b49225376d"
}

variable "instance_type" {
  description = "Instance type for the EC2 instance"
  default     = "t3a.large"
}
