# One EC2 box running Caddy (HTTPS) + Next.js + Postgres via docker compose.
# No ALB, NAT, RDS, CloudFront or Lambda: ~US$17/month.

data "aws_vpc" "default" {
  default = true
}

data "aws_ssm_parameter" "ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "random_password" "cron" {
  length  = 40
  special = false
}

resource "aws_eip" "app" {
  domain = "vpc"
  tags   = { Name = "bid-poc" }
}

locals {
  domain = var.domain != "" ? var.domain : "${replace(aws_eip.app.public_ip, ".", "-")}.sslip.io"
  env_file = join("\n", [
    "NODE_ENV=production",
    "APP_URL=https://${local.domain}",
    "POSTGRES_PASSWORD=${random_password.db.result}",
    "DATABASE_URL=postgresql://bid:${random_password.db.result}@db:5432/bid",
    "CRON_SECRET=${random_password.cron.result}",
    "STRIPE_SECRET_KEY=${var.stripe_secret_key}",
    "STRIPE_WEBHOOK_SECRET=${var.stripe_webhook_secret}",
    "ADMIN_EMAILS=${var.admin_emails}",
    "RESEND_API_KEY=${var.resend_api_key}",
    "EMAIL_FROM=${var.email_from}",
  ])
}

# Standard-tier SecureString parameters are free (vs Secrets Manager at $0.40/secret/mo).
resource "aws_ssm_parameter" "env" {
  name  = "/bid-poc/env"
  type  = "SecureString"
  value = local.env_file
}

resource "aws_security_group" "app" {
  name_prefix = "bid-poc-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  ingress {
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  # No SSH: use `aws ssm start-session` instead.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_role" "app" {
  name_prefix = "bid-poc-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ec2.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "read_env" {
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "ssm:GetParameter", Resource = aws_ssm_parameter.env.arn }]
  })
}

resource "aws_iam_instance_profile" "app" {
  name_prefix = "bid-poc-"
  role        = aws_iam_role.app.name
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.ami.value
  instance_type          = var.instance_type
  iam_instance_profile   = aws_iam_instance_profile.app.name
  vpc_security_group_ids = [aws_security_group.app.id]

  metadata_options {
    http_tokens = "required"
  }
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    repo_url = var.repo_url
    repo_ref = var.repo_ref
    domain   = local.domain
    region   = var.region
    param    = aws_ssm_parameter.env.name
  })

  tags       = { Name = "bid-poc", Backup = "daily" }
  depends_on = [aws_iam_role_policy.read_env]
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}

# Daily EBS snapshots (7 kept) since Postgres lives on the instance disk. Pennies/month.
resource "aws_iam_role" "dlm" {
  name_prefix = "bid-poc-dlm-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "dlm.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "daily" {
  description        = "bid-poc daily snapshots"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["INSTANCE"]
    target_tags    = { Backup = "daily" }
    schedule {
      name = "daily"
      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["06:00"]
      }
      retain_rule {
        count = 7
      }
      copy_tags = true
    }
  }
}
