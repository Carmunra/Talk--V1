output "public_ip" { value = aws_eip.app.public_ip }
output "instance_id" { value = aws_instance.app.id }
output "repository_url" { value = aws_ecr_repository.app.repository_url }
output "runtime_secret_arn" { value = aws_secretsmanager_secret.runtime.arn }
output "deploy_role_arn" { value = aws_iam_role.deploy.arn }
output "origin" { value = "https://${var.domain}" }
output "bootstrap_fingerprint" { value = sha256(aws_instance.app.user_data) }
