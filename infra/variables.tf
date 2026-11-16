variable "region" {
  type    = string
  default = "us-east-1"
}

variable "repo_url" {
  type    = string
  default = "https://github.com/geothegeo/bid-template.git" # must be public (or embed a token)
}

variable "repo_ref" {
  type    = string
  default = "main"
}

variable "instance_type" {
  type    = string
  default = "t4g.small" # 2 GB RAM; t4g.micro is too small to build Next.js + run Postgres
}

variable "domain" {
  type        = string
  default     = ""
  description = "Your domain (A record -> output public_ip). Empty = free <ip>.sslip.io hostname with auto HTTPS."
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
  default   = "" # fill in after creating the webhook endpoint, then re-apply
}

variable "admin_emails" {
  type    = string
  default = ""
}

variable "resend_api_key" {
  type      = string
  sensitive = true
  default   = "" # empty = emails are logged, not sent
}

variable "email_from" {
  type    = string
  default = "Directory <noreply@example.com>"
}
