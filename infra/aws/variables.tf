variable "account_id" {
  type = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "Informe a conta AWS verificada."
  }
}
variable "region" {
  type    = string
  default = "sa-east-1"
  validation {
    condition     = var.region == "sa-east-1"
    error_message = "Esta configuração foi preparada para São Paulo."
  }
}
variable "environment" {
  type = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Use staging ou production."
  }
}
variable "domain" {
  type = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]+\\.[a-z]{2,}$", var.domain))
    error_message = "Domínio sem protocolo, caminho ou caracteres de configuração."
  }
}
variable "ami_id" {
  type        = string
  description = "AMI oficial Amazon Linux 2023 x86_64 em São Paulo, revisada e fixada antes do plano."
  validation {
    condition     = can(regex("^ami-[a-f0-9]{17}$", var.ami_id))
    error_message = "Fixe o ID de uma AMI oficial; não usar latest automaticamente."
  }
}
variable "proxy_image" {
  type        = string
  description = "Imagem oficial library/caddy fixada pelo digest revisado."
  validation {
    condition     = can(regex("^caddy@sha256:[a-f0-9]{64}$", var.proxy_image))
    error_message = "Use caddy@sha256:DIGEST imutável."
  }
}
variable "monthly_budget_usd" {
  type = number
  validation {
    condition     = var.monthly_budget_usd > 0 && var.monthly_budget_usd <= 1000
    error_message = "Informe orçamento mensal aprovado; alertas não limitam cobranças."
  }
}
variable "alert_email" {
  type = string
  validation {
    condition     = can(regex("^[^@ ]+@[^@ ]+\\.[^@ ]+$", var.alert_email))
    error_message = "Informe o destinatário operacional aprovado."
  }
}
variable "github_oidc_provider_arn" {
  type        = string
  description = "Provider token.actions.githubusercontent.com existente/revisado na conta; bootstrap separado."
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:oidc-provider/token.actions.githubusercontent.com$", var.github_oidc_provider_arn))
    error_message = "Informe o provider OIDC do GitHub da conta, sem chaves estáticas."
  }
}
variable "deployment_confirmed" {
  type        = bool
  default     = false
  description = "Somente true depois de aprovar plano, custos, acesso e tratamento dos dados."
}
