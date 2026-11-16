output "public_ip" {
  value = aws_eip.app.public_ip
}

output "app_url" {
  value = "https://${local.domain}"
}

output "stripe_webhook_url" {
  value = "https://${local.domain}/api/webhooks/stripe"
}

output "shell" {
  value = "aws ssm start-session --target ${aws_instance.app.id} --region ${var.region}"
}
