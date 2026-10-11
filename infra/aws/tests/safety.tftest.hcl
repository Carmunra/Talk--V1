mock_provider "aws" {
  mock_data "aws_ami" {
    defaults = { architecture = "x86_64", name = "al2023-ami-fixture" }
  }
}
variables {
  account_id               = "123456789012"
  environment              = "staging"
  domain                   = "staging.example.test"
  ami_id                   = "ami-0123456789abcdef0"
  proxy_image              = "caddy@sha256:0000000000000000000000000000000000000000000000000000000000000000"
  monthly_budget_usd       = 60
  alert_email              = "ops@example.test"
  github_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
  deployment_confirmed     = true
}
run "safe_defaults" {
  command = plan
  assert {
    condition     = aws_instance.app.metadata_options[0].http_tokens == "required" && aws_instance.app.metadata_options[0].http_put_response_hop_limit == 1
    error_message = "Exigir IMDSv2 e impedir uso de metadata por containers."
  }
  assert {
    condition     = aws_instance.app.root_block_device[0].encrypted && aws_instance.app.disable_api_termination && aws_instance.app.credit_specification[0].cpu_credits == "standard"
    error_message = "Disco criptografado, proteção contra exclusão e sem cobrança de CPU burst."
  }
  assert {
    condition     = length(aws_security_group.app.ingress) == 2 && alltrue([for rule in aws_security_group.app.ingress : contains([80, 443], rule.from_port) && rule.from_port == rule.to_port])
    error_message = "Não expor SSH, manutenção ou porta 3000."
  }
  assert {
    condition     = aws_ecr_repository.app.image_tag_mutability == "IMMUTABLE" && aws_secretsmanager_secret.runtime.recovery_window_in_days == 30
    error_message = "Imagem imutável e segredo recuperável."
  }
}
run "unapproved_costs_blocked" {
  command = plan
  variables { deployment_confirmed = false }
  expect_failures = [aws_instance.app]
}
run "wrong_account_oidc_blocked" {
  command = plan
  variables { github_oidc_provider_arn = "arn:aws:iam::999999999999:oidc-provider/token.actions.githubusercontent.com" }
  expect_failures = [aws_instance.app]
}
